/**
 * A simple confetti animation effect for celebrations.
 * Creates and animates colorful particles across the screen.
 */
export default function confetti() {
  const colors = ['#c0c0c0', '#a0a0a0', '#e0e0e0', '#808080', '#404040', '#d4d4d4'];
  const shapes = ['circle', 'square', 'triangle'];
  
  // Get viewport dimensions
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Create container for confetti
  const confettiContainer = document.createElement('div');
  confettiContainer.style.position = 'fixed';
  confettiContainer.style.top = '0';
  confettiContainer.style.left = '0';
  confettiContainer.style.width = '100%';
  confettiContainer.style.height = '100%';
  confettiContainer.style.pointerEvents = 'none';
  confettiContainer.style.zIndex = '9999';
  confettiContainer.id = 'confetti-container';
  
  // Remove any existing confetti container
  const existingContainer = document.getElementById('confetti-container');
  if (existingContainer) {
    existingContainer.remove();
  }
  
  document.body.appendChild(confettiContainer);
  
  // Generate particles
  const particleCount = Math.min(150, Math.floor(width * height / 10000));
  
  for (let i = 0; i < particleCount; i++) {
    setTimeout(() => {
      createParticle(confettiContainer, colors, shapes, width, height);
    }, i * 20); // Stagger creation for more natural effect
  }
  
  // Clean up after animation completes
  setTimeout(() => {
    if (confettiContainer && document.body.contains(confettiContainer)) {
      // Fade out
      confettiContainer.style.transition = 'opacity 1s ease-out';
      confettiContainer.style.opacity = '0';
      
      // Remove from DOM after fade
      setTimeout(() => {
        if (confettiContainer && document.body.contains(confettiContainer)) {
          document.body.removeChild(confettiContainer);
        }
      }, 1000);
    }
  }, 4000);
}

function createParticle(container: HTMLDivElement, colors: string[], shapes: string[], width: number, height: number) {
  // Create particle element
  const particle = document.createElement('div');
  
  // Random properties
  const color = colors[Math.floor(Math.random() * colors.length)];
  const shape = shapes[Math.floor(Math.random() * shapes.length)];
  const size = Math.random() * 10 + 5;
  
  // Initial positioning - mostly from top of screen
  const startX = Math.random() * width;
  const startY = -size;
  
  // Set styles
  particle.style.position = 'absolute';
  particle.style.width = `${size}px`;
  particle.style.height = `${size}px`;
  particle.style.backgroundColor = color;
  particle.style.left = `${startX}px`;
  particle.style.top = `${startY}px`;
  
  // Apply shape
  if (shape === 'circle') {
    particle.style.borderRadius = '50%';
  } else if (shape === 'triangle') {
    particle.style.width = '0';
    particle.style.height = '0';
    particle.style.backgroundColor = 'transparent';
    particle.style.borderLeft = `${size/2}px solid transparent`;
    particle.style.borderRight = `${size/2}px solid transparent`;
    particle.style.borderBottom = `${size}px solid ${color}`;
  }
  
  // Add to container
  container.appendChild(particle);
  
  // Animation properties
  const duration = Math.random() * 3 + 2; // 2-5 seconds
  const delay = Math.random() * 0.5;
  const horizontalMovement = (Math.random() - 0.5) * 200; // Left or right drift
  const rotationSpeed = Math.random() * 360;
  
  // Apply animation
  particle.style.transition = `all ${duration}s ease-out ${delay}s`;
  
  // Start animation on next frame
  requestAnimationFrame(() => {
    particle.style.transform = `translate(${horizontalMovement}px, ${height + size}px) rotate(${rotationSpeed}deg)`;
    particle.style.opacity = '0';
  });
  
  // Remove particle when animation completes
  setTimeout(() => {
    if (particle && container.contains(particle)) {
      container.removeChild(particle);
    }
  }, (duration + delay) * 1000);
}