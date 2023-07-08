// Following https://www.youtube.com/watch?v=kySGqoU7X-s for a blob blur effect

function followMouse() {
  document.body.onpointermove = function(event) {
    const { clientX, clientY } = event;
    blob.style.left = clientX + 'px';
    blob.style.top = clientY + 'px';

    blob.animate({
      left: clientX + 'px',
      top: clientY + 'px',
    }, {
      duration: 3000,
      fill: 'forwards',
      easing: 'ease'
    })
  }
}

const blob = document.getElementById('blob');
let momentum = [1, 1];
if(window.innerWidth > 768) {
  followMouse()
}
