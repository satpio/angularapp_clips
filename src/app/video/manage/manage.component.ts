import { Component, OnInit } from '@angular/core';
import { ClipService } from 'src/app/services/clip.service';
import IClip from 'src/app/models/clip.model';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css']
})
export class ManageComponent implements OnInit {

  clips: IClip[] = [];
  activeClip: IClip | null = null;

  constructor(
    private clipService: ClipService,
    private modal: ModalService
  ) {

  }

  ngOnInit(): void {
    this.clipService.getUserClips().subscribe((docs) => {
      this.clips = [];
      docs.forEach((doc) => {
        this.clips.push({
          docId: doc.id,
          ...doc.data()
        })
      })
    });
  }

  openModal($event: Event, clip: IClip) {
    $event.preventDefault();
    this.activeClip = clip;
    this.modal.toggleModal('editClip');
  }

  update($event: IClip) {
    this.clips.forEach((clip, index) => {
      if (clip.docId === $event.docId) {
        this.clips[index].title = $event.title;
      }
    })
  }

  deleteClip($event: Event, clip: IClip) {
    $event.preventDefault();
    this.clipService.deleteClipt(clip);
    this.clips.forEach((item, index) => {
      if (clip.docId === item.docId) {
        this.clips.splice(index, 1);
      }
    })
  }

  async copyToClipboard($event: MouseEvent, docId: string | undefined) {
    $event.preventDefault();
    if (!docId) {
      return;
    }
    const url = `${location.origin}/clip/${docId}`;
    await navigator.clipboard.writeText(url);
    alert('Link copied!');
  }

}
