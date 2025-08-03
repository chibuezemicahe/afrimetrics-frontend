// Create and update the bubble chart
useEffect(() => {
  if (!svgRef.current || dimensions.width === 0) return;

  const svg = d3.select(svgRef.current);
  svg.selectAll('*').remove();

  const filteredData = getFilteredData();
  
  // Create force simulation with optimized parameters
  const simulation = d3.forceSimulation(filteredData as d3.SimulationNodeDatum[])
    .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
    .force('charge', d3.forceManyBody().strength(-30)) // Stronger repulsion
    .force('collide', d3.forceCollide().radius((d: any) => getBubbleSize(d) + 5).iterations(2)) // Better collision detection
    .alphaDecay(0.01) // Slower decay for more natural movement
    .velocityDecay(0.2) // Lower velocity decay for smoother animation
    .on('tick', ticked)
    .on('end', () => {
      // When simulation ends, update state with final node positions
      setSimulationNodes([...simulation.nodes()]);
    });

  // Create tooltip
  const tooltip = d3.select(tooltipRef.current)
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background-color', 'white')
    .style('border', '1px solid #ddd')
    .style('border-radius', '8px')
    .style('padding', '12px')
    .style('box-shadow', '0 4px 6px rgba(0, 0, 0, 0.1)')
    .style('z-index', '10');

  function ticked() {
    // Update nodes during simulation
    setSimulationNodes([...simulation.nodes()]);
  }

  // Update simulation when filters change
  return () => {
    simulation.stop();
  };
}, [dimensions, selectedPerformance, selectedTimeframe, data]);