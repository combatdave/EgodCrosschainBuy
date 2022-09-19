import { Component, OnInit } from '@angular/core';
import { ErrorMessageService } from './error-message.service';

@Component({
  selector: 'app-error-message-renderer',
  templateUrl: './error-message-renderer.component.html',
  styleUrls: ['./error-message-renderer.component.scss']
})
export class ErrorMessageRendererComponent implements OnInit {

  constructor(public errorService: ErrorMessageService) { }

  ngOnInit(): void {
  }

  public clearMessage() {
    this.errorService.ClearMessage();
  }

}
