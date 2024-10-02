import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';


@Component({
  standalone: true,
  selector: 'app-hand-landmarker',
  templateUrl: './hand-landmarker.component.html',
  styleUrls: ['./hand-landmarker.component.css']
})
export class HandLandmarkerComponent implements OnInit {
  @ViewChild('videoElement', { static: true }) videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement', { static: true }) canvasElement?: ElementRef<HTMLCanvasElement>;

  private handLandmarker: any;
  private running: boolean = false;

  constructor() { }

  async ngOnInit(): Promise<void> {
    await this.initializeHandLandmarker();
  }

  async initializeHandLandmarker() {
    const vision = await FilesetResolver.forVisionTasks(
       "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );

    // Create the handLandmarker instance
    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: "GPU"
      },
      runningMode: 'VIDEO',
      numHands: 2
    });

    this.startWebcam();
  }

  startWebcam() {
    const video = this.videoElement!!.nativeElement;
    const canvas = this.canvasElement!!.nativeElement;
    const ctx = canvas.getContext('2d');

    // Start the video stream from webcam
    navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      video.srcObject = stream;
      video.play();

      video.onloadeddata = () => {
        this.running = true;
        this.processVideo();
      };
    });
  }

  processVideo() {
    const video = this.videoElement!!.nativeElement;
    const canvas = this.canvasElement!!.nativeElement;
    const ctx = canvas.getContext('2d')!!;

    const detectHands = async () => {
      if (!this.running) return;

      // Detect hands in the current video frame
      const results = await this.handLandmarker.detectForVideo(video, Date.now());

      // Clear the canvas before drawing new results
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      if (results.landmarks.length > 0) {
        for (const landmarks of results.landmarks) {
          const drawingUtils = new DrawingUtils(ctx); 
          drawingUtils.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
            color: "#00FF00",
            lineWidth: 5
          });
          drawingUtils.drawLandmarks(landmarks, { color: "#FF0000", lineWidth: 1 }); 
          //ctx.fillStyle = 'red';
          // landmarks.forEach((landmark:any) => {
          //   ctx.beginPath();
          //   ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 5, 0, 2 * Math.PI);
          //   ctx.fill();
          // });
        }
      }

      requestAnimationFrame(detectHands);
    };

    detectHands();
  }

  ngOnDestroy() {
    this.running = false;
  }
}
