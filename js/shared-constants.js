const margin = { top: 40, right: 30, bottom: 50, left: 70 };
const width = 800;
const height = 500;  
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const xScale = d3.scaleLinear();
const yScale = d3.scaleLinear();
