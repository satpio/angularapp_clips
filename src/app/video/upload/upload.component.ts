import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage';
import { v4 as uuid } from 'uuid';
import { combineLatest, forkJoin, switchMap } from 'rxjs';
import firebase from 'firebase/compat/app';
import { ClipService } from 'src/app/services/clip.service';
import { Router } from '@angular/router';
import { FfmpegService } from 'src/app/services/ffmpeg.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css']
})
export class UploadComponent implements OnDestroy {

  isDragOver: boolean = false;
  nextStep: boolean = false;
  file: File | null = null;
  inSubmission: boolean = false;
  showAlert: boolean = false;
  alertMsg: string = '';
  alertColor: string = '';
  percentage: number = 0;
  showPercentage: boolean = false;
  user: firebase.User | null = null;
  clipTask?: AngularFireUploadTask;
  screenshots: string[] = [];
  selectedScreenshot: string = '';
  screenshotTask?: AngularFireUploadTask;

  title = new FormControl('', [
    Validators.required,
    Validators.minLength(3)
  ]);

  uploadForm = new FormGroup({
    title: this.title
  });

  constructor(
    private auth: AngularFireAuth,
    private storage: AngularFireStorage,
    private clipService: ClipService,
    private router: Router,
    public ffmpegService: FfmpegService
  ) {
    auth.user.subscribe((user) => this.user = user);
    this.ffmpegService.init();
  }

  ngOnDestroy(): void {
    this.clipTask?.cancel();
  }

  async storeFile($event: Event) {
    if (this.ffmpegService.isRunning) {
      return;
    }
    this.isDragOver = false;
    this.file = ($event as DragEvent).dataTransfer ?
      ($event as DragEvent).dataTransfer?.files.item(0) ?? null :
      ($event.target as HTMLInputElement).files?.item(0) ?? null;
    if (!this.file || this.file.type !== 'video/mp4') {
      return;
    }
    this.screenshots = await this.ffmpegService.getScreenshots(this.file);
    this.selectedScreenshot = this.screenshots[0];
    this.title.setValue(this.file.name.replace(/\.[^/.]+$/, ''));
    this.nextStep = true;
  }

  selectScreenshot(screenshot: string) {
    this.selectedScreenshot = screenshot;
  }

  async upload() {
    this.uploadForm.disable();
    this.inSubmission = true;
    this.showAlert = true;
    this.showPercentage = true;
    this.alertMsg = 'Please wait, your clip is being uploaded!';
    this.alertColor = 'blue';
    const clipFileName = `${uuid()}.mp4`;
    const clipPath = `clips/${clipFileName}`;
    const screenshotBlob = await this.ffmpegService.blobFromURL(this.selectedScreenshot);
    const screenshotPath = `screenshots/${clipFileName}.png`;
    this.clipTask = this.storage.upload(clipPath, this.file);
    const clipRef = this.storage.ref(clipPath);
    this.screenshotTask = this.storage.upload(screenshotPath, screenshotBlob);
    const screenshotRef = this.storage.ref(screenshotPath);
    combineLatest(
      [
        this.clipTask.percentageChanges(),
        this.screenshotTask.percentageChanges()
      ]
    ).subscribe((progress) => {
      const [clipProgress, screenshotProgress] = progress;
      if (!clipProgress || !screenshotProgress) {
        return;
      }
      const total = clipProgress + screenshotProgress;
      this.percentage = total as number / 200;
    });
    forkJoin(
      [
        this.clipTask.snapshotChanges(),
        this.screenshotTask.snapshotChanges()
      ]
    ).pipe(
      switchMap(() => forkJoin(
        [
          clipRef.getDownloadURL(),
          screenshotRef.getDownloadURL()
        ]
      ))
    ).subscribe({
      next: async (urls) => {
        const [clipUrl, screenshotUrl] = urls;
        const clip = {
          uid: this.user?.uid as string,
          displayName: this.user?.displayName as string,
          title: this.title.value as string,
          fileName: `${clipFileName}`,
          clipUrl,
          screenshotUrl,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          screenshotFileName: `${clipFileName}.png`
        };
        const clipDocRef = await this.clipService.createClip(clip);
        this.showPercentage = false;
        this.alertMsg = 'Success! Your clip has been uploaded.';
        this.alertColor = 'green';
        setTimeout(() => {
          this.router.navigate(['clip', clipDocRef.id]);
        }, 2000)
      },
      error: () => {
        this.uploadForm.enable();
        this.showPercentage = false;
        this.inSubmission = true;
        this.alertMsg = 'An unexcpeted error ocurred. Try again later';
        this.alertColor = 'red';
      }
    });
  }

}
