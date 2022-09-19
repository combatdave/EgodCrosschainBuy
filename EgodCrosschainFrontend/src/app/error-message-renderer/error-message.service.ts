import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ErrorMessageService {

  private _message?: string;

  constructor() { }

  public SetMessage(message: string) {
    console.error(message);
    this._message = message;
  }

  public get message(): string | undefined {
    return this._message;
  }

  public ClearMessage() {
    this._message = undefined;
  }
}
