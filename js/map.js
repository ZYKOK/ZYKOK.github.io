let svg, color, valuemap, projection, path, legend;

function drawMap(ausMap, deathsData) {
     // Compute initial filtered data (latest year)
    const tooltip = createTooltip("#map");
    const latestYear = d3.max(deathsData, d => d.Year);
    const filteredData = deathsData.filter(d => d.Year === latestYear);

    // Create lookup
    valuemap = new Map(filteredData.map(d => [
        d.State.trim().toLowerCase(),
        +d["Count*(CrashID)"]
    ]));

    // Color scale
    const maxDeaths = d3.max(filteredData, d => d["Count*(CrashID)"]);
    color = d3.scaleQuantize()
        .domain([0, maxDeaths])
        .range(d3.schemeBlues[9]);

    const width = 900, height = 610;

    svg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("background", "white");

    projection = d3.geoMercator().fitSize([width, height], ausMap);
    path = d3.geoPath(projection);

    // Draw states
    svg.selectAll("path")
        .data(ausMap.features)
        .join("path")
        .attr("fill", d => {
            const val = valuemap.get(d.properties.STATE_NAME.trim().toLowerCase());
            return val ? color(val) : "#ccc";
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .attr("d", path)
        .append("title")
        .text(d => {
            const val = valuemap.get(d.properties.STATE_NAME.trim().toLowerCase());
            return `${d.properties.STATE_NAME}: ${val ?? "No data"} deaths`;
        });

    const states = svg.selectAll("path");
    states
    .on("mouseover", function (event, d) {
        const state = d.properties.STATE_NAME.trim().toLowerCase();
        const val = valuemap.get(state);

        const blockColor = val ? color(val) : null;

        // Highlight matching legend block
        legend.selectAll(".legend-block")
            .attr("stroke", d => d.color === blockColor ? "#000" : "none")
            .attr("stroke-width", d => d.color === blockColor ? 2 : 0);


        d3.select(this)
            .raise()
            .attr("stroke", "#000")
            .attr("stroke-width", 1.5);

        tooltip.show(event, `
            <strong>${d.properties.STATE_NAME}</strong><br>
            Fatalities: ${val ?? "No data"}
        `);
    })
    .on("mousemove", function (event) {
        tooltip.move(event);
    })
    .on("mouseout", function () {
        d3.select(this)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1);
        
        legend.selectAll(".legend-block")
         .attr("stroke", "none");

        tooltip.hide();
    });


    // --- Step 6: Add legend ---
    const legendWidth = 260, legendHeight = 10;
    const legendX = d3.scaleLinear().domain(color.domain()).range([0, legendWidth]);

    const legend = svg.append("g")
        .attr("transform", `translate(${width - legendWidth - 600}, 40)`);

    legend.selectAll("rect")
        .data(color.range().map(c => {
            const d = color.invertExtent(c);
            if (!d[0]) d[0] = legendX.domain()[0];
            if (!d[1]) d[1] = legendX.domain()[1];
            return { d, color: c };
        }))
        .join("rect")
            .attr("class", "legend-block")
            .attr("x", d => legendX(d.d[0]))
            .attr("y", 0)
            .attr("width", d => legendX(d.d[1]) - legendX(d.d[0]))
            .attr("height", legendHeight)
            .attr("fill", d => d.color);

    legend.call(d3.axisBottom(legendX)
        .tickSize(13)
        .tickFormat(d3.format("d"))
        .tickValues(color.thresholds()))
        .select(".domain").remove();

    legend.append("text")
        .attr("id", "legendLabel")
        .attr("y", -6)
        .attr("x", legendWidth / 2)
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .attr("text-anchor", "middle")
        .attr("fill", "#000")
        .text(`Number of Fatalities in Australia`);
}

function getValue(data, d) {
    const lookup = new Map(data.map(dd => [
        dd.State.trim().toLowerCase(),
        +dd["Count*(CrashID)"]
    ]));
    return lookup.get(d.properties.name.trim().toLowerCase());
}

function updateMap(deathsData, year) {
    // Filter data for selected year
    const filteredData = deathsData.filter(d => d.Year === year);

    // Recompute color scale
    const maxDeaths = d3.max(filteredData, d => +d["Count*(CrashID)"]);
    color.domain([0, maxDeaths]);

    // Create lookup
    const lookup = new Map(filteredData.map(d => [
        d.State.trim().toLowerCase(),
        +d["Count*(CrashID)"]
    ]));

    valuemap = lookup;

    // Update map fill colors
    svg.selectAll("path")
        .transition()
        .duration(700)
        .attr("fill", d => {
            const val = lookup.get(d.properties.STATE_NAME.trim().toLowerCase());
            return val ? color(val) : "#ccc";
        })
        .select("title")
        .text(d => {
            const val = lookup.get(d.properties.STATE_NAME.trim().toLowerCase());
            return `${d.properties.STATE_NAME}: ${val ?? "No data"} deaths`;
        });
}


