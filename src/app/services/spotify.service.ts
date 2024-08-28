import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SpotifyService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getRandomLikedSongs(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/random-liked-songs`);
  }

  login(): void {
    window.location.href = `${this.apiUrl}/login`;
  }
}
