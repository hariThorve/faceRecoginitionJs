// Simple in-memory "backend" store for demo
let enrolledDescriptor = null;

// Load models on page load
window.addEventListener('load', async () => {
  document.getElementById('statusText').textContent = 'Loading models...';

  // Use official hosted models (no local /models folder needed!)
  await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights');
  await faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights');
  await faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights');

  document.getElementById('statusText').textContent = 'Models loaded.';
});

// Handle registration image upload
const regInput = document.getElementById('regImageUpload');
const regPreview = document.getElementById('regImagePreview');

regInput.addEventListener('change', async () => {
  const file = regInput.files[0];
  if (!file) return;
  const img = await faceapi.bufferToImage(file);
  regPreview.src = img.src;
});

// Enroll face from uploaded image
document.getElementById('btnRegister').addEventListener('click', async () => {
  if (!regPreview.src) {
    alert('Upload an image first');
    return;
  }
  document.getElementById('statusText').textContent = 'Enrolling face...';

  const detection = await faceapi
    .detectSingleFace(regPreview, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    document.getElementById('statusText').textContent = 'No face found in image.';
    return;
  }

  enrolledDescriptor = Array.from(detection.descriptor); // Float32Array -> plain array
  document.getElementById('statusText').textContent = 'Face enrolled (descriptor stored).';

  // In real app, send to backend:
  // await fetch('/api/enroll', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ userId, descriptor: enrolledDescriptor })
  // });
});

// Start webcam
document.getElementById('btnStartCam').addEventListener('click', async () => {
  const video = document.getElementById('video');
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video.srcObject = stream;
});

// Verify live face against enrolled descriptor
document.getElementById('btnVerify').addEventListener('click', async () => {
  if (!enrolledDescriptor) {
    alert('No enrolled face. Register first.');
    return;
  }
  const video = document.getElementById('video');
  if (!video.srcObject) {
    alert('Start camera first.');
    return;
  }

  document.getElementById('statusText').textContent = 'Verifying...';

  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    document.getElementById('statusText').textContent = 'No face detected in webcam.';
    return;
  }

  const liveDescriptor = Array.from(detection.descriptor);

  // Euclidean distance between two descriptors
  const distance = faceapi.euclideanDistance(enrolledDescriptor, liveDescriptor);
  const threshold = 0.6; // tune for your use case

  if (distance < threshold) {
    document.getElementById('statusText').textContent =
      `Face verified (distance=${distance.toFixed(3)})`;
  } else {
    document.getElementById('statusText').textContent =
      `Face NOT matched (distance=${distance.toFixed(3)})`;
  }
});
