/*
    Simple demo showing some interactivity options of Highcharts Gantt. More
    custom behavior can be added using event handlers and API calls. See
    http://api.highcharts.com/gantt.
*/

let today = new Date(),
    isAddingTask = false;

const day = 1000 * 60 * 60 * 24,
    each = Highcharts.each,
    btnShowDialog = document.getElementById('btnShowDialog'),
    btnRemoveTask = document.getElementById('btnRemoveSelected'),
    btnAddTask = document.getElementById('btnAddTask'),
    btnCancelAddTask = document.getElementById('btnCancelAddTask'),
    addTaskDialog = document.getElementById('addTaskDialog'),
    inputName = document.getElementById('inputName'),
    selectDepartment = document.getElementById('selectDepartment'),
    selectDependency = document.getElementById('selectDependency'),
    chkMilestone = document.getElementById('chkMilestone');

// Set to 00:00:00:000 today
today.setUTCHours(0);
today.setUTCMinutes(0);
today.setUTCSeconds(0);
today.setUTCMilliseconds(0);
today = today.getTime();


// Update disabled status of the remove button, depending on whether or not we
// have any selected points.
function updateRemoveButtonStatus() {
    const chart = this.series.chart;
    // Run in a timeout to allow the select to update
    setTimeout(function () {
        btnRemoveTask.disabled = !chart.getSelectedPoints().length ||
            isAddingTask;
    }, 10);
}


// Create the chart
const chart = Highcharts.ganttChart('container', {

    chart: {
        spacingLeft: 1
    },

    title: {
        text: 'Interactive Gantt Chart'
    },

    subtitle: {
        text: 'Drag and drop points to edit'
    },

    lang: {
        accessibility: {
            axis: {
                xAxisDescriptionPlural: 'The chart has a two-part X axis showing time in both week numbers and days.'
            }
        }
    },

    accessibility: {
        point: {
            descriptionFormat: '{#if milestone}' +
                '{name}, milestone for {yCategory} at {x:%Y-%m-%d}.' +
                '{else}' +
                '{name}, assigned to {yCategory} from {x:%Y-%m-%d} to {x2:%Y-%m-%d}.' +
                '{/if}'
        }
    },

    plotOptions: {
        series: {
            animation: false, // Do not animate dependency connectors
            dragDrop: {
                draggableX: true,
                draggableY: true,
                dragMinY: 0,
                dragMaxY: 2,
                dragPrecisionX: day / 3 // Snap to eight hours
            },
            dataLabels: {
                enabled: true,
                format: '{point.name}',
                style: {
                    cursor: 'default',
                    pointerEvents: 'none'
                }
            },
            allowPointSelect: true,
            point: {
                events: {
                    select: updateRemoveButtonStatus,
                    unselect: updateRemoveButtonStatus,
                    remove: updateRemoveButtonStatus
                }
            }
        }
    },

    yAxis: {
        type: 'category',
        categories: ['Tech', 'Marketing', 'Sales'],
        accessibility: {
            description: 'Organization departments'
        },
        min: 0,
        max: 2
    },

    xAxis: {
        currentDateIndicator: true
    },

    tooltip: {
        xDateFormat: '%a %b %d, %H:%M'
    },

    series: [{
        name: 'Project 1',
        data: [{
            start: today + 2 * day,
            end: today + day * 5,
            name: 'Prototype',
            id: 'prototype',
            y: 0
        },  {
            start: today + day * 6,
            name: 'Prototype done',
            milestone: true,
            dependency: 'prototype',
            id: 'proto_done',
            y: 0
        }, {
            start: today + day * 7,
            end: today + day * 11,
            name: 'Testing',
            dependency: 'proto_done',
            y: 0
        }, {
            start: today + day * 5,
            end: today + day * 8,
            name: 'Product pages',
            y: 1
        }, {
            start: today + day * 9,
            end: today + day * 10,
            name: 'Newsletter',
            y: 1
        }, {
            start: today + day * 9,
            end: today + day * 11,
            name: 'Licensing',
            id: 'testing',
            y: 2
        }, {
            start: today + day * 11.5,
            end: today + day * 12.5,
            name: 'Publish',
            dependency: 'testing',
            y: 2
        }]
    }]
});


/* Add button handlers for add/remove tasks */

btnRemoveTask.onclick = function () {
    const points = chart.getSelectedPoints();
    each(points, function (point) {
        point.remove();
    });
};

btnShowDialog.onclick = function () {
    // Update dependency list
    let depInnerHTML = '<option value=""></option>';
    each(chart.series[0].points, function (point) {
        depInnerHTML += '<option value="' + point.id + '">' + point.name +
            ' </option>';
    });
    selectDependency.innerHTML = depInnerHTML;

    // Show dialog by removing "hidden" class
    addTaskDialog.className = 'overlay';
    isAddingTask = true;

    // Focus name field
    inputName.value = '';
    inputName.focus();
};

btnAddTask.onclick = function () {
    // Get values from dialog
    const series = chart.series[0],
        name = inputName.value,
        dependency = chart.get(
            selectDependency.options[selectDependency.selectedIndex].value
        ),
        y = parseInt(
            selectDepartment.options[selectDepartment.selectedIndex].value,
            10
        );
    let undef,
        maxEnd = series.points.reduce(function (acc, point) {
            return point.y === y && point.end ? Math.max(acc, point.end) : acc;
        }, 0);

    const milestone = chkMilestone.checked || undef;

    // Empty category
    if (maxEnd === 0) {
        maxEnd = today;
    }

    // Add the point
    series.addPoint({
        start: maxEnd + (milestone ? day : 0),
        end: milestone ? undef : maxEnd + day,
        y: y,
        name: name,
        dependency: dependency ? dependency.id : undef,
        milestone: milestone
    });

    // Hide dialog
    addTaskDialog.className += ' hidden';
    isAddingTask = false;
};

btnCancelAddTask.onclick = function () {
    // Hide dialog
    addTaskDialog.className += ' hidden';
    isAddingTask = false;
};
