// See https://en.wikipedia.org/wiki/Boids for explanations on the rules of boids
const vision_radius = 100;
const rule_1_weight = 0.01;
const rule_2_weight = 0.01;
const rule_3_weight = 0.01;
const minSpeed = 0.5;
const maxSpeed = 1.5;

// from https://catppuccin.com/palette/
const flocks = [
  (alpha) => `rgb(125, 196, 228,${alpha})`, // blue
  (alpha) => `rgb(166, 218, 149,${alpha})`, // green
  // (alpha) => `rgb(245, 169, 127,${alpha})`, // peach
  // (alpha) => `rgb(198, 160, 246,${alpha})`, // purple
  // (alpha) => `rgb(238, 212, 159,${alpha})`, // yellow
];

function getCenter(nodes) {
  if (nodes.length === 0) return { x: 0, y: 0 };
  const sum = nodes.reduce(
    (acc, node) => {
      acc.x += node.x;
      acc.y += node.y;
      return acc;
    },
    { x: 0, y: 0 },
  );
  return { x: sum.x / nodes.length, y: sum.y / nodes.length };
}

function getAverageVelocity(nodes) {
  if (nodes.length === 0) return { vx: 0, vy: 0 };
  const sum = nodes.reduce(
    (acc, node) => {
      acc.vx += node.vx;
      acc.vy += node.vy;
      return acc;
    },
    { vx: 0, vy: 0 },
  );
  return { vx: sum.vx / nodes.length, vy: sum.vy / nodes.length };
}

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

  // use a grid to store nodes for faster neighbor lookup
  let grid = {};
  function addToGrid(node) {
    const x = Math.floor(node.x / vision_radius);
    const y = Math.floor(node.y / vision_radius);
    const key = `${x},${y}`;
    if (!grid[key]) {
      grid[key] = [];
    }
    grid[key].push(node);
  }

  function removeFromGrid(node) {
    const x = Math.floor(node.x / vision_radius);
    const y = Math.floor(node.y / vision_radius);
    const key = `${x},${y}`;
    if (grid[key]) {
      grid[key] = grid[key].filter((n) => n !== node);
      if (grid[key].length === 0) {
        delete grid[key];
      }
    }
  }

    /**
     * Given a node, return an array of all of the nodes in its cell
     * and every cell in each of the 8 surrounding cells.
     */
  function getNeighbors(node) {
    const xIndex = Math.floor(node.x / vision_radius);
    const yIndex = Math.floor(node.y / vision_radius);
    const neighbors = [];

      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const key = `${xIndex + dx},${yIndex + dy}`;
          if (grid[key]) {
            neighbors.push(...grid[key]);
          }
        }
      }

      // if on the edge, get neighbors from the opposite edge
      if (xIndex < 0) {
        const key = `${Math.floor(width / vision_radius) - 1},${yIndex}`;
        if (grid[key]) {
          neighbors.push(...grid[key]);
        }
      } else if (xIndex >= Math.floor(width / vision_radius)) {
        const key = `0,${yIndex}`;
        if (grid[key]) {
          neighbors.push(...grid[key]);
        }
      }
      if (yIndex < 0) {
        const key = `${xIndex},${Math.floor(height / vision_radius) - 1}`;
        if (grid[key]) {
          neighbors.push(...grid[key]);
        }
      } else if (yIndex >= Math.floor(height / vision_radius)) {
        const key = `${xIndex},0`;
        if (grid[key]) {
          neighbors.push(...grid[key]);
        }
      }

      return neighbors
        .filter((n) => n !== node) // Exclude the node itself
        .filter((n) => n.flock === node.flock); // Only include nodes from the same flock
    }

  const nodes = [];
  for (let i = 0; i < 240; i++) {
    const node = {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1,
      radius: Math.random() * 3 + 1,
      flock: i % flocks.length,
    };
    nodes.push(node);
    addToGrid(node);
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Move and draw nodes
    nodes.forEach((node) => {
      const neighbors = getNeighbors(node);
      // Rule 1 - Cohesion: Boids try to fly towards the centre of mass of neighbouring boids.
      const centerOfMass = getCenter(neighbors);
      if (neighbors.length > 0) {
        const dx = centerOfMass.x - node.x;
        const dy = centerOfMass.y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
          node.vx += (dx / distance) * rule_1_weight;
          node.vy += (dy / distance) * rule_1_weight;
        }
      }

      // Rule 2 - Separation: Boids try to keep a small distance away from other objects (including other boids).
      neighbors.forEach((n) => {
        const dx = n.x - node.x;
        const dy = n.y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < vision_radius && distance > 0) {
          const force = rule_2_weight * (1 - distance / vision_radius);
          node.vx -= (dx / distance) * force;
          node.vy -= (dy / distance) * force;
        }
      });

      // Rule 3 - Alignment: Boids try to match velocity with near boids.
      const avgVelocity = getAverageVelocity(neighbors);
      node.vx += (avgVelocity.vx - node.vx) * rule_3_weight;
      node.vy += (avgVelocity.vy - node.vy) * rule_3_weight;

      // Rule 4 - Moderation: Boids try to move within the speed limits
      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed < minSpeed) {
        node.vx += (minSpeed - speed) * (node.vx / speed);
        node.vy += (minSpeed - speed) * (node.vy / speed);
      } else if (speed > maxSpeed) {
        node.vx -= (speed - maxSpeed) * (node.vx / speed);
        node.vy -= (speed - maxSpeed) * (node.vy / speed);
      }

      removeFromGrid(node);

      node.x += node.vx;
      node.y += node.vy;

      addToGrid(node);

      if (node.x < -node.radius) node.x = width + node.radius;
      if (node.x > width + node.radius) node.x = -node.radius;
      if (node.y < -node.radius) node.y = height + node.radius;
      if (node.y > height + node.radius) node.y = -node.radius;
    });

    // Draw connecting lines
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        if (a.flock !== b.flock) continue; // Only draw lines between nodes in the same flock
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < vision_radius) {
          const alpha = 0.75 - dist / vision_radius;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = flocks[a.flock](alpha);
          ctx.lineWidth = Math.min(a.radius, b.radius) * alpha;
          ctx.stroke();
        }
      }
    }

    nodes.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = flocks[p.flock](0.5);
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  draw();
}

setup();
