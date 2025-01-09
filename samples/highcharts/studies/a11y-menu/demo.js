// Storing preference states globally
let selectedVerbosity = 'default',
    selectedTextSize = 'default',
    isContrastChecked = false,
    isBorderChecked = false,
    selectedColorTheme = 'default';
// const settingsImgSrc = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Windows_Settings_icon.svg/639px-Windows_Settings_icon.svg.png';

function initializeChart() {
    const chart = Highcharts.chart('container', getChartConfig());
    chart.prefMenu = {};
    addPrefButton(chart);
    addCustomA11yComponent(chart);
    addPrefButtonScreenReader(chart);
    return chart;
}

function getChartConfig() {
    return {
        chart: {
            type: 'column',
            styledMode: true
        },
        title: {
            text: 'Corn vs wheat estimated production for 2023'
        },
        subtitle: {
            text:
                'Source: <a target="_blank" ' +
                'href="https://www.indexmundi.com/agriculture/?commodity=corn">indexmundi</a>'
        },
        xAxis: {
            categories: ['USA', 'China', 'Brazil', 'EU', 'Argentina', 'India'],
            crosshair: true,
            accessibility: {
                description: 'Countries'
            }
        },
        yAxis: {
            min: 0,
            title: {
                text: '1000 metric tons (MT)'
            }
        },
        tooltip: {
            valueSuffix: ' (1000 MT)'
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },
        series: [
            {
                name: 'Corn',
                data: [387749, 280000, 129000, 64300, 54000, 34300]
            },
            {
                name: 'Wheat',
                data: [45321, 140000, 10000, 140500, 19500, 113500]
            }
        ]
    };
}


function addPrefButton(chart) {
    // TODO: Fix responsiveness of button
    chart.prefMenu.prefButton = chart.renderer.button(
        'Preferences', 670, 10, () => handlePrefButtonClick(chart)
    )
        .attr({
            id: 'hc-pref-button'
        })
        .add();
}

function addPrefButtonScreenReader(chart) {
    const screenReaderDiv =
        document.getElementById('highcharts-screen-reader-region-before-0');
    const screenReaderDivInnerDiv = screenReaderDiv.children[0];
    const tableButton =
        document.getElementById('hc-linkto-highcharts-data-table-0');
    const prefButton = document.createElement('button');
    prefButton.textContent = 'Preferences';
    prefButton.id = 'hc-pref-button';
    prefButton.addEventListener('click', () => handlePrefButtonClick(chart));

    // Ensure screenReaderDiv and tableButton exist
    if (screenReaderDiv && tableButton) {
        screenReaderDivInnerDiv.insertBefore(
            prefButton, screenReaderDivInnerDiv.children[4]
        );
    }
}

function handlePrefButtonClick(chart) {
    chart.accessibility.keyboardNavigation.blocked = true;
    const dialog = createPreferencesDialog(chart);
    document.body.appendChild(dialog);
    dialog.showModal();

    trapFocusInDialog(dialog);

    const firstFocusable = dialog.querySelector('button, select');
    if (firstFocusable) {
        firstFocusable.focus();
    }
}

function createPreferencesDialog(chart) {
    const prefContent = document.createElement('dialog');
    prefContent.setAttribute('id', 'pref-menu-dialog');
    const closeID = 'hc-dlg-close-btn' + chart.index;

    prefContent.innerHTML = `
    <button id="${closeID}" class="dlg-close" aria-label="Close dialog">
        Close
    </button>
    <h2>Preferences</h2>
    <p>Customize your chart settings to enhance your experience.</p>
    <h3>Color Theme</h3>
    <div class="pref color-theme">
        <input type="radio" id="c-default" name="color-theme" value="none"
        ${selectedColorTheme === 'default' ? 'checked' : ''}>
        <label for="c-default">System default</label>
        <input type="radio" id="color-light" name="color-theme" value="light"
        ${selectedColorTheme === 'light' ? 'checked' : ''}>
        <label for="color-light">Light</label>
        <input type="radio" id="color-dark" name="color-theme" value="dark"
        ${selectedColorTheme === 'dark' ? 'checked' : ''}>
        <label for="color-dark">Dark</label>
    </div>
    <h3>Verbosity:</h3>
    <div class="pref verbosity">
        <input type="radio" id="low" name="verbosity" value="low"
        ${selectedVerbosity === 'low' ? 'checked' : ''}>
        <label for="low">Low</label>
        <input type="radio" id="ver-default" name="verbosity" value="default"
        ${selectedVerbosity === 'default' ? 'checked' : ''}>
        <label for="ver-default">Default</label>
    </div>
    <h3>Text size:</h3>
    <div class="pref textsize">
        <input type="radio" id="smaller" name="textsize" value="smaller"
        ${selectedTextSize === 'smaller' ? 'checked' : ''}>
        <label for="smaller">Smaller</label>
        <input type="radio" id="t-size-default" name="textsize" value="default"
        ${selectedTextSize === 'default' ? 'checked' : ''}>
        <label for="t-size-default">Default</label>
        <input type="radio" id="larger" name="textsize" value="larger"
        ${selectedTextSize === 'larger' ? 'checked' : ''}>
        <label for="larger">Larger</label>
    </div>
    <h3>Enhance contrast:</h3>
    <div class="pref contrast">
        <input type="checkbox" id="contrast" name="contrast"
        ${isContrastChecked ? 'checked' : ''}>
        <label for="contrast">Increase contrast</label>
        <input type="checkbox" id="border" name="border"
        ${isBorderChecked ? 'checked' : ''}>
        <label for="border">Add border</label>
    </div>
    `;


    setupEventListeners(prefContent, chart);

    const closeButton = prefContent.querySelector(`#${closeID}`);
    closeButton.addEventListener('click', () =>
        closePreferencesDialog(prefContent, chart)
    );
    return prefContent;
}

function setupEventListeners(prefContent, chart) {
    const textSizeRadioButtons =
        prefContent.querySelectorAll('input[name="textsize"]');
    const verbosityRadioButtons =
        prefContent.querySelectorAll('input[name="verbosity"]');
    const screenReaderDiv =
        document.getElementById('highcharts-screen-reader-region-before-0');
    const contrastCheckbox =
        prefContent.querySelector('input[name="contrast"]');
    const borderCheckbox = prefContent.querySelector('input[name="border"]');
    const themeRadioButtons =
        prefContent.querySelectorAll('input[name="color-theme"]');

    // For verbosity setting
    const innerScreenReaderDiv = screenReaderDiv.children[0];
    const description = innerScreenReaderDiv.children[3];
    const descriptionText = description.textContent;

    textSizeRadioButtons.forEach(radio => {
        radio.addEventListener('change', event => {
            const selectedSize = event.target.value;
            selectedTextSize = selectedSize;

            // Apply the selected size
            switch (selectedSize) {
            case 'smaller':
                chart.update({
                    chart: {
                        style: {
                            fontSize: '10px'
                        }
                    }
                });
                break;
            case 'normal':
                chart.update({
                    chart: {
                        style: {
                            fontSize: '12px'
                        }
                    }
                });
                break;
            case 'larger':
                chart.update({
                    chart: {
                        style: {
                            fontSize: '20px'
                        }
                    }
                });
                break;
            default:
                chart.update({
                    chart: {
                        style: {
                            fontSize: '12px'
                        }
                    }
                });
                break;
            }
        });
    });
    verbosityRadioButtons.forEach(radio => {
        radio.addEventListener('change', event => {
            const verbosity = event.target.value;
            selectedVerbosity = verbosity;

            if (verbosity === 'low') {

                // Shorten description
                const descArray = description.textContent.split('. ');
                const newDesc = descArray.slice(
                    0, descArray.length - 2
                ).join('. ') + '.';
                description.textContent = newDesc;

                // Remove axis information
                innerScreenReaderDiv.children[5].style.display = 'none';
                innerScreenReaderDiv.children[6].style.display = 'none';

                // TODO: Shorten description for points somehow?
                // Just value and unit without series?

            } else {
                // Re-apply full description
                description.textContent = descriptionText;

                // Re-apply axis information
                innerScreenReaderDiv.children[5].style.display = 'block';
                innerScreenReaderDiv.children[6].style.display = 'block';

            }
        });
    });

    // TODO: Also add darkmode to the other elements outside of the chart?
    themeRadioButtons.forEach(radio => {
        radio.addEventListener('change', event => {
            const theme = event.target.value;
            selectedColorTheme = theme;

            document.getElementById('container').className =
                event.target.value === 'none' ?
                    '' : `highcharts-${event.target.value}`;
        });
    });

    contrastCheckbox.addEventListener('change', event => {
        const isChecked = event.target.checked;
        isContrastChecked = isChecked; // Store state
        if (isChecked) {
            console.log('contrast box is checked');

            chart.update({
                colors: ['#247eb2', '#403b9b']
            });

        } else {
            chart.update({
                colors: ['#2cb0ff', '#544fc6']
            });

        }
    });

    borderCheckbox.addEventListener('change', event => {
        const isChecked = event.target.checked;
        isBorderChecked = isChecked; // Store state
        if (isChecked) {
            chart.update({
                series: [{
                    borderColor: '#061823',
                    borderWidth: 2
                }, {
                    borderColor: '#000000',
                    borderWidth: 2
                }]
            });
        } else {
            chart.update({
                series: [{
                    borderColor: null,
                    borderWidth: 0
                }, {
                    borderColor: null,
                    borderWidth: 0
                }]
            });
        }
    });
}

function trapFocusInDialog(dialog) {

    // Trap focus within the dialog
    const focusableElements = dialog.querySelectorAll(
        'button, select, input, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    dialog.addEventListener('keydown', e => {
        if (e.key === 'Tab') {
            if (e.shiftKey && document.activeElement === firstFocusable) {
                e.preventDefault();
                lastFocusable.focus();
            } else if (
                !e.shiftKey && document.activeElement === lastFocusable
            ) {
                e.preventDefault();
                firstFocusable.focus();
            }
        } else if (e.key === 'Escape') {
            dialog.close();
        }
    });
}

function closePreferencesDialog(dialog, chart) {
    dialog.close();
    chart.accessibility.keyboardNavigation.blocked = false;
    dialog.remove();
    chart.container.focus();
}

function addCustomA11yComponent(chart) {
    // Create custom component for the chart.
    const CustomComponent = function (chart) {
        this.initBase(chart);
    };
    CustomComponent.prototype = new Highcharts.AccessibilityComponent();

    Highcharts.extend(CustomComponent.prototype, {
        onChartUpdate: updateCustomComponent,
        getKeyboardNavigation: createKeyboardNavigationHandler
    });

    // Update the chart with the new component, also adding it in the keyboard
    // navigation order
    chart.update({
        accessibility: {
            customComponents: {
                customComponent: new CustomComponent(chart)
            },
            keyboardNavigation: {
                order: ['series', 'customComponent', 'chartMenu', 'legend']
            }
        }
    });
}

// Perform tasks to be done when the chart is updated
function updateCustomComponent() {
    // Get our button if it exists, and sest attributes on it
    const namespace = this.chart.prefMenu || {};
    if (namespace.prefButton) {
        namespace.prefButton.attr({
            role: 'button',
            tabindex: -1,
            ariaHidden: true
        });
        Highcharts.A11yChartUtilities.unhideChartElementFromAT(
            this.chart, namespace.prefButton.element
        );
    }
}

// Define keyboard navigation for this component
function createKeyboardNavigationHandler() {
    const keys = this.keyCodes,
        chart = this.chart,
        namespace = chart.prefMenu || {},
        component = this;

    return new Highcharts.KeyboardNavigationHandler(chart, {
        keyCodeMap: [
            // On arrow/tab we just move to the next chart element.
            // If we had multiple buttons we wanted to group together,
            // we could move between them here.
            [[
                keys.tab, keys.up, keys.down, keys.left, keys.right
            ], function (keyCode, e) {
                return this.response[
                    keyCode === this.tab && e.shiftKey ||
                    keyCode === keys.left || keyCode === keys.up ?
                        'prev' : 'next'
                ];
            }],

            // Space/enter means we click the button
            [[
                keys.space, keys.enter
            ], function () {
                // Fake a click event on the button element
                const buttonElement = namespace.prefButton &&
                        namespace.prefButton.element;
                if (buttonElement) {
                    component.fakeClickEvent(buttonElement);
                }
                return this.response.success;
            }]
        ],

        // Focus button initially
        init() {
            const buttonElement = namespace.prefButton &&
                    namespace.prefButton.element;
            if (buttonElement && buttonElement.focus) {
                buttonElement.focus();
            }
        }
    });
}

// Initialize chart
initializeChart();
