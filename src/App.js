import { useEffect, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import Alert from "@material-ui/lab/Alert";
import Grid from "@material-ui/core/Grid";
import './AppChoroplethMap.css';

const CreateChart = () => {
  useEffect( ()=> {
  let dataE, dataC, min, max, container, heading, chart, colorScale, tooltip, legendContainer, legend, widthOfLegend;

  const preInit = async() => {
    var data_education;
    var data_county;
    
    await d3.json("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json")
      .then( data => { data_education = data });

    await d3.json("https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json")
      .then( data => { data_county = data });
    
    init(data_education, data_county)
  }

  preInit();

  const init = (data_education, data_county) => {
    dataE = data_education;
    dataC = data_county;
    
    createUtils();
    createContainer();
    createHeading();
    createChart();
    createColorScale();
    createMap();
    createLegend();
    //setScroll();
  }

  const createUtils = () => {
    min = (array=[], prop) => d3.min(array, d => d[prop]);
    max = (array=[], prop) => d3.max(array, d => d[prop]);
  };

  // const setScroll = () => {
  //   // estas función no se está ejecutando
  //   if(window.innerWidth < 750) 
  //     window.scrollTo(window.innerWidth / 2, window.innerHeight / 2);
  // }

  const createContainer = () => {
    container = d3.select(".map")
      .append("div")
      .attr("class", "container");
  }

  const createHeading = () => {
    heading = container
      .append("div")
      .attr("id", "heading");
    
    heading
      .append("h1")
      .attr("id", "title")
      .html("Mapa coroplético con D3")
    
    heading
      .append("div")
      .attr("id", "description")
      .html("Porcentaje (%) de adultos mayores de 25 años con un título secundario (o superior) en Estados Unidos (2010 - 2014)");
  }

  const createChart = () => {
    chart = container
      .append("svg")
      .attr("width", 1000)
      .attr("height", 600)
      .attr("id", "chart")
  }

  const createColorScale = () => {
    colorScale = d3.scaleQuantile()
      .domain([min(dataE, "bachelorsOrHigher"), max(dataE, "bachelorsOrHigher")])
      .range(["#c0e1ec", "#a9d6e5", "#89c2d9", "#61a5c2", "#468faf", "#2c7da0", "#2a6f97", "#014f86", "#013a63", "#012a4a"])
  }

  const createTooltip = (e, d) => {
    // e.offsetX e Y son los únicos que funcionan bien
    // el problema está en el scroll Y, me dejaba un espacio en blanco grande
    // abajo del .container y tuve que deshabilitarlo  en CSS con overflow-y: hidden;
    // y eso produjo que la pantalla se mueva en el eje X de manera diferente, asique
    // usar e.screenX..Y no sirve, ni tampoco clientX..Y - Por lo que encontré la alternativa
    // offsetX..Y que funciona perfectamente para este problema.

    var xMouse = e.offsetX < 730 ? e.offsetX + 10 : e.offsetX - 220;
    var yMouse = e.offsetY < 500 ? e.offsetY + 20 : e.offsetY - 75;

    tooltip = chart
      .append("g")
      .attr("class", "tooltip")
    
    tooltip
      .append("rect")
      .attr("width", 210)
      .attr("height", 55)
      .attr("x", xMouse)
      .attr("y", yMouse)
      .attr("rx", 4)
      .attr("ry", 4)
      .attr("fill", "#cc2936")
      .transition().duration(10).style("opacity", 1)
    
    tooltip
      .append("text")
      .attr("class", "tooltip-text")
      .attr("id", "tooltip")
      .attr("data-education", d.bachelorsOrHigher)
      .attr("x", xMouse + 5)
      .attr("y", yMouse + 20)
      .attr("fill", "#c0e1ec")
      .html(`
        <tspan dy="0em" x=${xMouse + 5}>Bachelors or higher: ${d.bachelorsOrHigher} %</tspan>
        <tspan dy="1.5em" x=${xMouse + 5}>State: ${d.state}</tspan>
      `);
  } 

  const createMap = () => {
    
    var geoPath = d3.geoPath();
    
    var featureData = topojson.feature(dataC, dataC.objects.counties).features;
    
    chart
      .selectAll("path")
      .data(featureData)
      .enter()
      .append("path")
      .attr("d", geoPath)
      .attr("class", d => `county county-${d.id}`)
      .attr("data-fips", d => d.id)
      .attr("stroke", "#000")
      .attr("stroke-width", 0.3)
      .attr("data-education", d => {
        var bacherlorOrHigher_current = dataE.filter(element => element.fips === d.id)
        return bacherlorOrHigher_current[0].bachelorsOrHigher
      })
      .style("fill", d => {
        var bacherlorOrHigher_current = dataE.filter(element => element.fips === d.id)
        return colorScale(bacherlorOrHigher_current[0].bachelorsOrHigher)
      })
      .on("mouseover", (e, d) => {
        var bacherlorsOrHigher_current = dataE.filter(element => element.fips === d.id)
        createTooltip(e, bacherlorsOrHigher_current[0]);
      
        d3.select(`.county-${d.id}`)
          .transition().duration(10).attr("stroke", "#cc2936")
          .attr("stroke-width", 2)
        
      })
      .on("mouseout", (e, d) => {
        d3.selectAll(".tooltip")
          .transition().duration(10).style("opacity", 0).remove();
        d3.selectAll(".tooltip-text")
          .transition().duration(10).style("opacity", 0).remove();
        d3.select(`.county-${d.id}`)
          .transition().duration(60).attr("stroke-width", 0.3)
          .transition().duration(60).attr("stroke", "#000")
      })

    chart
      .append('path')
      .datum(
        topojson.mesh(dataC, dataC.objects.states, (a, b) => {
          return a !== b;
        })
      )
      .attr('class', 'states')
      .attr('d', geoPath); 
  }

  const createLegend = () => {
    var quantiles = colorScale.quantiles();
    var wRect = 38;
    widthOfLegend = wRect * quantiles.length;
    
    var xScale = d3.scaleBand()
      .domain(quantiles.map(d => d))
      .range([0, widthOfLegend])
      .paddingInner(1)
      .paddingOuter(.5)  
      .align(1);
    
    legendContainer = heading
      .append("div")
      .attr("id", "legend-container")
      .style("width", `${widthOfLegend + 50}px`)
      .style("height", "70px");
    
    legend = legendContainer
      .append("svg")
      .attr("id", "legend")
      .attr("width", widthOfLegend + 15)
      .attr("height", 70);

    legend
      .selectAll("rect")
      .data(quantiles)
      .enter()
      .append("rect")
      .attr("width", wRect)
      .attr("height", 20)
      .attr("x", (d,i) => (wRect * i) + 7.5)
      .attr("y", 18)
      .attr("fill", (d) => colorScale(d));
    
    var xAxis = d3.axisBottom(xScale)
      .tickFormat((d,i) => {
        return i !== quantiles.length - 1 
          ? d.toFixed(1)
          : "";
      })
      .tickSize(28, 1);
    
    legend
      .append("g")
      .attr("transform", `translate(7.5, 18)`)
      .style("font-size", ".8em")
      .style("font-weight", "bold")
      .style("alignment-baseline", "middle")
      .call(xAxis);
  }
},[]);

    return (
      <Grid item container className="map"> </Grid>
    );
}

const AppChoroplethMap = () => {
  const [alert, setAlert] = useState(true);

  return (
    <Grid item container justifyContent="center" alignItems="center" className="AppChoroplethMap">
      <CreateChart />
      {
        alert && window.innerWidth < 750 &&
        <Alert onClose={()=> setAlert(false)} 
        style={{color: "#ffffff", position: "fixed"}} 
        variant="filled" severity="info">
            La referencia de este proyecto está abajo del todo, y al medio :)
        </Alert>
      }
    </Grid>
  );
}

export default AppChoroplethMap;
