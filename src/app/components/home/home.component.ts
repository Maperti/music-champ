import { ChangeDetectorRef, Component, OnInit, Renderer2 } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  user: any;
  randomSongs: any[] = [];
  currentPair: any[] = [];
  chosenSongs: any[] = [];
  round: number = 1;
  winner: any = null;
  isLoading: boolean = false;

  constructor(private route: ActivatedRoute, private changeDetectorRef: ChangeDetectorRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const accessToken = params['access_token'];
      if (accessToken) {
        localStorage.setItem('spotify_access_token', accessToken);
      }
      this.user = JSON.parse(params['user']);
    });
  }

  fetchRandomLikedSongs(): void {
    this.isLoading = true;
    const accessToken = localStorage.getItem('spotify_access_token');
    if (accessToken) {
      fetch(`http://localhost:3000/random-liked-songs?access_token=${accessToken}`)
        .then(response => {
          if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error); });
          }
          return response.json();
        })
        .then(data => {
          this.randomSongs = data;
          this.nextPair();
          this.isLoading = false;
        })
        .catch(error => {
          console.error('Error fetching random liked songs:', error.message);
          this.isLoading = false;
        });
    }
  }

  nextPair(): void {
    if (this.randomSongs.length >= 2) {
      this.currentPair = this.randomSongs.splice(0, 2);
      this.resetAudioPlayer();
      this.changeDetectorRef.detectChanges();
      console.log('CURRENT PAIR:', this.currentPair);
    } else if (this.randomSongs.length === 1) {
      this.winner = this.randomSongs[0];
      this.currentPair = [];
    } else {
      this.round++;
      this.randomSongs = this.chosenSongs;
      this.chosenSongs = [];
      this.nextPair();
    }
  }

  chooseSong(song: any): void {
    this.chosenSongs.push(song);
    this.resetAudioPlayer();
    this.changeDetectorRef.detectChanges();
    this.nextPair();
  }

  startNewGame(): void {
    this.round = 1;
    this.chosenSongs = [];
    this.winner = null;
    this.fetchRandomLikedSongs();
    this.resetAudioPlayer();
    this.changeDetectorRef.detectChanges();
  }

  resetAudioPlayer(): void {
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach((audio, index) => {
      const parent = audio.parentNode;
      const newAudio = this.renderer.createElement('audio');
      newAudio.controls = true;

      Array.from(audio.attributes).forEach(attr => {
        this.renderer.setAttribute(newAudio, attr.name, attr.value);
      });

      newAudio.className = audio.className;

      if (this.currentPair[index] && this.currentPair[index].preview_url) {
        const source = this.renderer.createElement('source');
        source.src = this.currentPair[index].preview_url;
        source.type = 'audio/mpeg';
        this.renderer.appendChild(newAudio, source);
      }

      this.renderer.removeChild(parent, audio);
      this.renderer.appendChild(parent, newAudio);
    });
  }
}
