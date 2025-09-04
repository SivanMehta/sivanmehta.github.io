function setup() {  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);
  
  const resize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    console.log(width, height);
  };
  
  window.addEventListener('resize', resize);
}

setup();
