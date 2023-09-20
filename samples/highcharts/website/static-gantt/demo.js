Math.easeInSine = function (pos) {
    return -Math.cos(pos * (Math.PI / 2)) + 1;
};

Math.easeOutQuint = function (pos) {
    return (Math.pow((pos - 1), 5) + 1);
};
// Math.easeInQuint = function (pos) {
//     return Math.pow(pos, 5);
// },

Math.easeOutBounce = pos => {
    if ((pos) < (1 / 2.75)) {
        return (7.5625 * pos * pos);
    }
    if (pos < (2 / 2.75)) {
        return (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75);
    }
    if (pos < (2.5 / 2.75)) {
        return (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375);
    }
    return (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375);
};

const big = window.matchMedia('(min-width: 500px)').matches;

let chart;

const ganttChart = function () {
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
        btnCloseAddTask = document.querySelector('.btn-close'),
        addTaskDialog = document.getElementById('addTaskDialog'),
        addTaskDialogOverlay = document.getElementById('modal-backdrop'),
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

    // Update disabled status of the remove button, depending on whether or not
    // we have any selected points.
    function updateRemoveButtonStatus() {
        const chart = this.series.chart;
        // Run in a timeout to allow the select to update
        setTimeout(function () {
            btnRemoveTask.disabled = !chart.getSelectedPoints().length ||
            isAddingTask;
            if (!btnRemoveTask.disabled) {
                btnRemoveTask.classList.remove('disabled');
            }


        }, 10);
    }

    // Create the chart
    chart = Highcharts.ganttChart('gantt', {
        chart: {
            height: 500,
            margin: [120, 10, 20, 10],
            spacing: [30, 0, 0, 10],
            events: {
                load: function () {
                    const chart = this;

                    const buttonGroup = document.getElementById('button-group');
                    const background = document.querySelector('.highcharts-background');
                    const scrollMask = document.querySelector('.highcharts-scrollable-mask');

                    buttonGroup.classList.add('on');
                    background.classList.add('on');
                    if (scrollMask) {
                        scrollMask.style.fill = '#2F2B38';
                    }

                    chart.series[0].points[6].onMouseOver();

                    if (!big) {
                        chart.update({
                            chart: {
                                margin: [80, 10, 20, 10],
                                scrollablePlotArea: {
                                    minHeight: 250,
                                    minWidth: 250
                                }
                            }
                        });
                    }

                },
                redraw: function () {
                    const background = document.querySelector('.highcharts-background');
                    const scrollMask = document.querySelector('.highcharts-scrollable-mask');
                    background.classList.add('on');
                    if (scrollMask) {
                        scrollMask.style.fill = '#2F2B38';
                    }

                }
            },
            styledMode: true
        },
        lang: {
            accessibility: {
                chartContainerLabel: '',
                screenReaderSection: {
                    beforeRegionLabel: '',
                    endOfChartMarker: ''
                }
            }
        },
        accessibility: {
            announceNewData: {
                enabled: true
            },
            screenReaderSection: {
                beforeChartFormat: '<h1>{chartTitle}</h1><p>{typeDescription}</p><p>{chartSubtitle}</p><p>Interactive Gantt diagram showing tasks and milestones across three departments, Tech, Marketing, and Sales.</p>'
            },
            point: {
                descriptionFormatter: function (point) {
                    const formatTime = t => point.series.chart.time.dateFormat(
                        '%a %B %e, %l:%M %p', new Date(t).getTime()
                    );
                    const startDate = formatTime(point.start);
                    const endDate = formatTime(point.end);
                    const category = point.yCategory;

                    return point.end ?
                        ` ${point.name}, from: ${startDate} to ${endDate}. ${category} department.` // eslint-disable-line
                        : ` Milestone, ${point.name}, ${startDate}. ${category} department.`; // eslint-disable-line
                }
            }
        },

        title: {
            text: 'Interactive Gantt Chart',
            floating: true
        },
        subtitle: {
            text: 'Drag and drop points to edit'
        },
        credits: {
            enabled: false
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
                borderRadius: 3,
                dataLabels: {
                    enabled: true,
                    allowOverlap: true,
                    format: '{point.name}',
                    style: {
                        cursor: 'default',
                        pointerEvents: 'none'
                    },
                    y: 15
                },
                connectors: {
                    endMarker: {
                        color: '#fff',
                        lineColor: '#fff'
                    }
                },
                pointPadding: 0.42,
                groupPadding: 0,
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
            title: {
                text: ''
            },
            categories: ['Tech', 'Marketing', 'Sales'],
            min: 0,
            max: 2,
            plotLines: [

                {
                    value: 0.5
                },
                {
                    value: 1.5
                },
                {
                    value: 2.5
                }],
            visible: true,
            grid: {
                enabled: false
            },
            padding: 0,
            labels: {
                useHTML: true,
                indentation: 0,
                formatter: function () {
                    const name = this.value;
                    if (this.value.length > 1) {
                        const htmlString = `<div class="gantt-label">
                            ${name}</div>`;
                        return htmlString;
                    }
                }
            }
        },
        xAxis: [
            {
                className: 'xAxis',
                minorTicks: true,
                gridLineDashStyle: 'dot',
                currentDateIndicator: true,
                dateTimeLabelFormats: {
                    day: {
                        list: ['%A, %e. %B', '%a, %e. %b', '%E']
                    }
                },
                grid: {
                    cellHeight: 15
                },
                labels: {
                    useHTML: true,
                    padding: 0,
                    formatter: function () {
                        const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                        const dayDate = new Date(this.value).getDay();
                        const day = days[dayDate];
                        const htmlString = `
                        <div class="day-label">${day}</div>`;
                        return htmlString;
                    }
                }
            },
            {
                grid: {
                    cellHeight: 20
                }
            }
        ],

        tooltip: {
            xDateFormat: '%a %b %d, %H:%M',
            outside: true,
            className: 'tip',
            shadow: false,
            stickOnContact: true
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
        }],
        responsive: {
            rules: [{
                condition: {
                    maxWidth: 250
                },
                chartOptions: {
                    chart: {
                        height: 250,
                        margin: [80, 10, 20, 10]
                    },
                    plotOptions: {
                        series: {
                            dataLabels: {
                                enabled: false,
                                y: 15
                            }
                        }
                    },
                    title: {
                        y: 0
                    },
                    subtitle: {
                        y: 50
                    }
                }
            },
            {
                condition: {
                    maxWidth: 300,
                    minWidth: 251
                },
                chartOptions: {
                    chart: {
                        height: 300
                    },
                    plotOptions: {
                        series: {
                            dataLabels: {
                                enabled: false,
                                y: 15
                            }
                        }
                    },
                    title: {
                        y: 0
                    },
                    subtitle: {
                        y: 50
                    }
                }
            },
            {
                condition: {
                    maxWidth: 400,
                    minWidth: 301
                },
                chartOptions: {
                    chart: {
                        height: 400
                    },
                    plotOptions: {
                        series: {
                            dataLabels: {
                                enabled: true,
                                y: 20
                            }
                        }
                    },
                    title: {
                        y: 0
                    },
                    subtitle: {
                        y: 50
                    }
                }
            },
            {
                condition: {
                    minWidth: 499
                },
                chartOptions: {
                    chart: {
                        height: 500,
                        margin: [120, 10, 20, 10]
                    },
                    plotOptions: {
                        series: {
                            dataLabels: {
                                y: 25
                            }
                        }
                    },
                    title: {
                        y: 10
                    },
                    subtitle: {
                        y: 30
                    }
                }
            }]
        }
    });


    /* Add button handlers for add/remove tasks */

    function hideDialog() {
        addTaskDialog.classList.remove('show');
        addTaskDialogOverlay.classList.remove('show');
        isAddingTask = false;
        btnShowDialog.focus();
    }

    btnRemoveTask.onclick = function () {
        const points = chart.getSelectedPoints();
        each(points, function (point) {
            point.remove();
        });
    };

    addTaskDialog.addEventListener('keydown', function (e) {
        if (e.keyCode === 27) {
            hideDialog();
        }
    });

    btnShowDialog.onclick = function () {
        // Update dependency list

        let depInnerHTML = '<option value=""></option>';
        each(chart.series[0].points, function (point) {
            depInnerHTML += '<option value="' + point.id + '">' + point.name +
        ' </option>';
        });
        selectDependency.innerHTML = depInnerHTML;

        document.getElementsByTagName('body')[0].classList.add('modal-open');
        addTaskDialogOverlay.classList.add('show');
        addTaskDialog.classList.add('show');

        // Show dialog by removing "hidden" class
        // addTaskDialog.className = 'overlay';
        isAddingTask = true;

        addTaskDialog.focus();
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
            maxEnd = series.points.map(function (acc, point) {
                return point.y === y && point.end ?
                    Math.max(acc, point.end) : acc;
            }, 0);

        const milestone = chkMilestone.checked || undef;

        // Empty category
        if (maxEnd === 0) {
            maxEnd = today;
        }

        // Add the point
        if (name) {
            series.addPoint({
                start: maxEnd + (milestone ? day : 0),
                end: milestone ? undef : maxEnd + day,
                y: y,
                name: name,
                dependency: dependency ? dependency.id : undef,
                milestone: milestone
            });
        }

        hideDialog();
    };

    btnCancelAddTask.onclick = hideDialog;
    btnCloseAddTask.onclick = hideDialog;

};

ganttChart();
