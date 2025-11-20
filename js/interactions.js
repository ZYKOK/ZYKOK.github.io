let TooltipInstance = null;

function createTooltip(parentSelector = "body") {
  if (TooltipInstance) return TooltipInstance; 
  
  let tooltip = d3.select(parentSelector)
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("background", "#fff")
    .style("border", "1px solid #ccc")
    .style("padding", "6px 10px")
    .style("border-radius", "4px")
    .style("pointer-events", "none")
    .style("opacity", 0)
    .style("box-shadow", "0 2px 6px rgba(0,0,0,0.2)");

  TooltipInstance = {
    show(event, html) {
      tooltip
        .html(html)
        .transition()
        .duration(200)
        .style("opacity", 0.95);
      this.move(event);
    },
    move(event) {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    },
    hide() {
      tooltip
          .transition()
          .duration(200)
          .style("opacity", 0);
    }
  };

  return TooltipInstance;
}


function setupYearSlider(deathsData, mapUpdateFunction) {
    const years = [...new Set(deathsData.map(d => +d.Year))].sort((a, b) => a - b);

    const chartWidth = 900; // same as your map/chart width
    const sliderWidth = chartWidth * 0.85; // slightly shorter than chart
    const sliderHeight = 90;

    const sliderContainer = d3.select("#filters_screen");
    sliderContainer.selectAll("*").remove();

    // ---- Center wrapper ----
    const wrapper = sliderContainer.append("div")
        .style("width", "100%")
        .style("display", "flex")
        .style("justify-content", "center") // center horizontally
        .style("align-items", "center");

    // ---- SVG slider ----
    const svg = wrapper.append("svg")
        .attr("width", sliderWidth)
        .attr("height", sliderHeight)
        .style("overflow", "visible");

    const margin = { left: 25, right: 25, top: 25 };
    const xScale = d3.scaleLinear()
        .domain([years[0], years[years.length - 1]])
        .range([margin.left, sliderWidth - margin.right])
        .clamp(true);

    let currentYear = years[years.length - 1];

    // --- Slider Track ---
    svg.append("line")
        .attr("x1", xScale.range()[0])
        .attr("x2", xScale.range()[1])
        .attr("y1", sliderHeight / 2)
        .attr("y2", sliderHeight / 2)
        .attr("stroke", "#d3d8e0")
        .attr("stroke-width", 10)
        .attr("stroke-linecap", "round");

    // --- Gradient highlight ---
    const gradient = svg.append("linearGradient")
        .attr("id", "sliderGradient")
        .attr("x1", "0%")
        .attr("x2", "100%");

    gradient.append("stop").attr("offset", "0%").attr("stop-color", "#4e91f9");
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "#6ecbff");

    const filledTrack = svg.append("line")
        .attr("y1", sliderHeight / 2)
        .attr("y2", sliderHeight / 2)
        .attr("stroke", "url(#sliderGradient)")
        .attr("stroke-width", 10)
        .attr("stroke-linecap", "round")
        .attr("x1", xScale.range()[0])
        .attr("x2", xScale(currentYear));

    // --- Handle ---
    const handle = svg.append("circle")
        .attr("cx", xScale(currentYear))
        .attr("cy", sliderHeight / 2)
        .attr("r", 12)
        .attr("fill", "#007bff")
        .attr("stroke", "#fff")
        .attr("stroke-width", 2)
        .style("cursor", "pointer");

    // --- Pulse effect ---
    const pulse = svg.append("circle")
        .attr("cx", xScale(currentYear))
        .attr("cy", sliderHeight / 2)
        .attr("r", 12)
        .attr("fill", "rgba(0, 123, 255, 0.35)")
        .style("pointer-events", "none");

    // --- Year label ---
    const yearLabel = svg.append("text")
        .attr("x", sliderWidth / 2)
        .attr("y", sliderHeight - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "15px")
        .style("font-weight", "600")
        .text(currentYear);

    // --- Major Ticks (every 5 years) ---
    const majorTicks = years.filter(y => y % 5 === 0 || y === years[years.length - 1]);
    svg.selectAll(".tick")
        .data(majorTicks)
        .enter()
        .append("line")
        .attr("class", "tick")
        .attr("x1", d => xScale(d))
        .attr("x2", d => xScale(d))
        .attr("y1", sliderHeight / 2 - 14)
        .attr("y2", sliderHeight / 2 + 14)
        .attr("stroke", "#7c8798")
        .attr("stroke-width", 2);

    svg.selectAll(".tick-label")
        .data(majorTicks)
        .enter()
        .append("text")
        .attr("class", "tick-label")
        .attr("x", d => xScale(d))
        .attr("y", sliderHeight / 2 - 20)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "#5a6573")
        .text(d => d);

    // --- Drag Behavior ---
    const drag = d3.drag()
        .on("start", () => pulse.transition().duration(200).attr("r", 20).style("opacity", 0.4))
        .on("drag", (event) => {
            const newX = Math.max(xScale.range()[0], Math.min(event.x, xScale.range()[1]));
            handle.attr("cx", newX)
            pulse.attr("cx", newX);
            filledTrack.attr("x2", newX);

            const nearestYear = Math.round(xScale.invert(newX));
            yearLabel.text(nearestYear);
            currentYear = nearestYear;
        })
        .on("end", () => {
            pulse.transition().duration(200).attr("r", 12).style("opacity", 0.25);
            mapUpdateFunction(deathsData, currentYear);
        });

    handle.call(drag);
    pulse.call(drag);

    // --- Play Button ---
    const playButton = sliderContainer.append("button")
        .text("▶ Play")
        .style("margin-left", "6em")
        .style("padding", "6px 14px")
        .style("background", "#007bff")
        .style("color", "white")
        .style("border", "none")
        .style("border-radius", "6px")
        .style("cursor", "pointer")
        .style("font-size", "14px")
        .style("transition", "0.2s");

    let playing = false;
    let interval = null;

    playButton.on("click", () => {
        if (!playing) {
            playButton.text("⏸ Pause");
            playing = true;
            let index = years.indexOf(currentYear);
            interval = setInterval(() => {
                index++;
                if (index >= years.length) {
                    clearInterval(interval);
                    playButton.text("▶ Play");
                    playing = false;
                    return;
                }
                currentYear = years[index];
                const newX = xScale(currentYear);
                handle.transition().duration(200).attr("cx", newX);
                pulse.transition().duration(200).attr("cx", newX);
                filledTrack.transition().duration(200).attr("x2", newX);
                yearLabel.text(currentYear);
                mapUpdateFunction(deathsData, currentYear);
            }, 700);
        } else {
            playing = false;
            playButton.text("▶ Play");
            clearInterval(interval);
        }
    });
}

function setupYearDropdown(data, Tooltip) {
  const select = document.getElementById("yearDropdown");

  const years = [...new Set(data.map(d => d.Year))].sort();

  select.innerHTML = `<option value="all">All Years</option>` +
    years.map(y => `<option value="${y}">${y}</option>`).join("");

  select.addEventListener("change", function () {
    const selected = this.value;

    if (selected === "all" ) {
      filteredData = dataGlobal;
      drawBarChart(Tooltip, null, dataGlobal);
      clearYearHighlight();
    } else {
      filteredData = dataGlobal.filter(d => d.Year == selected);
      drawBarChart(Tooltip, +selected, dataGlobal);
      highlightSelectedYear(+selected);
    }

    // Redraw all charts with the filtered data
    drawLineChart(Tooltip);
    drawDayOfWeekChart(Tooltip);
    drawScatterPlot(Tooltip);
  });
}

function clearYearHighlight() {
  d3.selectAll(".yearBar")
    .transition()
    .duration(300)
    .attr("fill", "#1f77b4")
    .attr("stroke", "none")
    .attr("stroke-width", 0);
}



