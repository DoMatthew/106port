import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

const projectsTitle = document.querySelector('.projects-title');

if (projectsTitle && projects) {
  projectsTitle.textContent = `${projects.length} Projects`;
}

const years = [...new Set(projects.map((project) => String(project.year)))].sort();
const colors = d3.scaleOrdinal(d3.schemeTableau10).domain(years);

const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
const sliceGenerator = d3.pie().value((d) => d.value);

let query = '';

let selectedYear = null;

function filterByQuery(projectsGiven) {
  return projectsGiven.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });
}


function updatePage() {
  let searchedProjects = filterByQuery(projects);

  let searchedYears = searchedProjects.map((project) => String(project.year));
  if (!searchedYears.includes(selectedYear)) {
    selectedYear = null;
  }

  let shownProjects =
    selectedYear === null
      ? searchedProjects
      : searchedProjects.filter((project) => String(project.year) === selectedYear);

  renderProjects(shownProjects, projectsContainer, 'h2');
  renderPieChart(searchedProjects);
}

function toggleYear(year) {
  selectedYear = selectedYear === year ? null : year;
  updatePage();
}

function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => String(d.year),
  );

  let data = rolledData
    .map(([year, count]) => ({ value: count, label: year }))
    .sort((a, b) => d3.ascending(a.label, b.label));

  let arcData = sliceGenerator(data);

  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();

  let legend = d3.select('.legend');
  legend.selectAll('li').remove();

  arcData.forEach((d) => {
    svg
      .append('path')
      .attr('d', arcGenerator(d))
      .attr('fill', colors(d.data.label))
      .attr('class', d.data.label === selectedYear ? 'selected' : null)
      .on('click', () => toggleYear(d.data.label));
  });

  data.forEach((d) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(d.label)}`)
      .attr('class', d.label === selectedYear ? 'selected' : null)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => toggleYear(d.label));
  });
}

renderPieChart(projects);

const searchInput = document.querySelector('.searchBar');

searchInput?.addEventListener('input', (event) => {
  query = event.target.value;
  updatePage();
});
