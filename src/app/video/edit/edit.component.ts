import { Component, OnInit, OnDestroy, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import IClip from 'src/app/models/clip.model';
import { ModalService } from 'src/app/services/modal.service';
import { ClipService } from 'src/app/services/clip.service';

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css']
})
export class EditComponent implements OnInit, OnDestroy, OnChanges {

  @Input() activeClip: IClip | null = null;

  inSubmission: boolean = false;
  showAlert: boolean = false;
  alertMsg: string = '';
  alertColor: string = '';
  @Output() update = new EventEmitter();

  clipId = new FormControl('', {
    nonNullable: true
  })

  title = new FormControl('', {
    validators: [
      Validators.required,
      Validators.minLength(3)
    ],
    nonNullable: true
  });

  editForm = new FormGroup({
    title: this.title,
    id: this.clipId
  });

  constructor(
    private clipService: ClipService,
    private modal: ModalService
  ) { }

  ngOnInit(): void {
    this.modal.register('editClip');
  }

  ngOnDestroy(): void {
    this.modal.unregister('editClip');
  }

  ngOnChanges(): void {
    if (!this.activeClip || !this.activeClip.docId) {
      return;
    }
    this.inSubmission = false;
    this.showAlert = false;
    this.clipId.setValue(this.activeClip.docId);
    this.title.setValue(this.activeClip.title);
  }

  async submit() {
    if (!this.activeClip) {
      return;
    }
    this.alertMsg = 'Please wait! Updating clip';
    this.alertColor = 'blue';
    this.inSubmission = true;
    this.showAlert = true;
    try {
      await this.clipService.updateClip(
        this.clipId.value,
        this.title.value
      );
    } catch (error) {
      this.inSubmission = false;
      this.alertColor = 'red';
      this.alertMsg = 'Something wen wrong. Try again later';
      return;
    }
    this.activeClip.title = this.title.value;
    this.update.emit(this.activeClip);
    this.inSubmission = false;
    this.alertColor = 'green';
    this.alertMsg = 'Success!';
  }

}
