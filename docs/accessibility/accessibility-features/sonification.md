Sonification
===

Sonification is a collective term for conveying information or perceptualizing data using non-speech audio. It is used all around us, imagine for example your grandfather’s clock with has an audible tick every second and chimes every hour.

In data visualization sonification is used for exploring the data without visual aid. This could be due to visual impairment, or for situational reasons. For example, a chart in a monitoring dashboard might play an alert sound if a value reaches a certain threshold. Visually impaired readers may find great use of sonification for getting an overview of the data, as well as identifying patterns, outliers, and points of interest.

For Highcharts, we provide a sonification module to allow you full control of playing your data using sound. The sonification module supports a wide range of different use cases, and is designed with flexibility in mind.

Note that this module is still considered experimental. Legacy browsers are not supported.

<iframe style="width: 100%; height: 635px; border: none;" src=https://www.highcharts.com/samples/embed/highcharts/demo/sonification allow="fullscreen"></iframe>

Installation
------------

Requires the `sonification.js` module. This adds the functions [Chart.sonify](https://api.highcharts.com/class-reference/Highcharts.Chart#sonify), [Series.sonify](https://api.highcharts.com/class-reference/Highcharts.Series#sonify), and [Point.sonify](https://api.highcharts.com/class-reference/Highcharts.Point#sonify), as well as several helper classes and functionality for controlling the playback of the chart. These are detailed below.

```html
<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://code.highcharts.com/modules/sonification.js"></script>
```

Features
----------------------------------------------

**Highlights:**

*   Supports playing back points with configurable mapping from point data to sound parameters, as well as sound parameters changing over time.
*   Supports playing back series with configurable timing of points.
*   Supports playing multiple series in sync, or in sequence. The order of series and delay between them is configurable.
*   Supports intelligent timing of points and series based on a configurable total target duration.
*   Supports playing custom Earcons while sonifying a point or series, either attached to a point or with a condition function. Earcons can also be played independently, and instantiated anywhere.
*   Defines a set of predefined instruments with different timbres and properties.
*   Supports limiting frequencies to scales or musical notes.
*   Supports user defined oscillator instruments.
*   Supports pausing and resuming the sonification, as well as reverse playing and programmatic moving of the play cursor.
*   Emits events for hooking into the processes.

See the [API documentation](https://api.highcharts.com/class-reference/Highcharts.Chart#sonify) for configuration details.

**Earcons:**
Earcons are ear-icons, predefined sounds that play to indicate something noteworthy. You might use an Earcon to play a specific sound to indicate the end of each series, or to indicate a point of interest on the chart.

<iframe style="width: 100%; height: 470px; border: none;" src=https://www.highcharts.com/samples/embed/highcharts/sonification/chart-earcon allow="fullscreen"></iframe>

**Instruments**  
The module makes use of the concept of instruments. When sonifying data, you specify the instruments you want to be playing, and you map data properties to instrument parameters. A common example would be to map y-values to the instrument frequency, which results in a sound that rises in pitch for higher data values. This is in most simple cases fairly intuitive to readers.

Use Cases
---------

**Simple sonification of points**  
In this example, we will show how to use [Point.sonify](https://api.highcharts.com/class-reference/Highcharts.Point#sonify) to sonify single points.

```js  
Highcharts.chart('container', {
    // ...
    series: [{
        // ...
        data: [
            1, 2, { y: 4, color: 'red' }, 5, 7, 9, 11, 13,
            { y: 6, color: 'red' }, 7, 1
        ],
        point: {
            events: {
                click: function () {
                    // Sonify the point when clicked
                    this.sonify({
                        instruments: [{
                            instrument: 'triangleMajor',
                            instrumentMapping: {
                                volume: function (point) {
                                    return point.color === 'red' ? 0.2 : 0.8;
                                },
                                duration: 200,
                                pan: 'x',
                                frequency: 'y'
                            },
                            // Start at C5 note, end at C6
                            instrumentOptions: {
                                minFrequency: 520,
                                maxFrequency: 1050
                            }
                        }]
                    });
                }
            }
        }
    }]
});
```

<iframe style="width: 100%; height: 470px; border: none;" src=https://www.highcharts.com/samples/embed/highcharts/sonification/point-basic allow="fullscreen"></iframe>

In the above example we call [Point.sonify](https://api.highcharts.com/class-reference/Highcharts.Point#sonify) when a point is clicked. The instrument options specify a predefined [Instrument](https://api.highcharts.com/class-reference/Highcharts.Instrument), the mapping of data properties to the instrument parameters, as well as options to pass to the instrument. We use a fixed 200ms duration for the point, map the x-value to panning (left to right), and the y-value to the note frequency. The volume is defined with a callback function, and returns a fixed value depending on the color of the point.

For a full overview of the available options, see [Point.sonify](https://api.highcharts.com/class-reference/Highcharts.Point#sonify).

**Simple sonification of series**  
In this example we will show how to use [Series.sonify](https://api.highcharts.com/class-reference/Highcharts.Series#sonify) to sonify series, and how this differs from sonifying single points.

```js  
Highcharts.chart('container', {
    // ...
    plotOptions: {
        series: {
            // ...
            events: {
                click: function () {
                    // Sonify the series when clicked
                    this.sonify({
                        duration: 2200,
                        pointPlayTime: 'x',
                        instruments: [{
                            instrument: 'triangleMajor',
                            instrumentMapping: {
                                volume: 0.8,
                                duration: 250,
                                pan: 'x',
                                frequency: 'y'
                            },
                            // Start at C5 note, end at C6
                            instrumentOptions: {
                                minFrequency: 520,
                                maxFrequency: 1050
                            }
                        }]
                    });
                }
            }
        }
    }
});
```   

<iframe style="width: 100%; height: 470px; border: none;" src=https://www.highcharts.com/samples/embed/highcharts/sonification/series-basic allow="fullscreen"></iframe>

In the above example we sonify a series when the series is clicked. The main difference between sonifying a series and a single point is the addition of the overall `duration` option, as well as the `pointPlayTime` option. Both of these are required in order to sonify the series.

The overall `duration` parameter sets a target duration for the sonification. This will determine how close together the points are played. Note that if you set duration low, it is possible that one note will start playing before the previous has ended. In this case the new note takes precedence, and the old note is stopped. Also note that the target duration is not exact, but should be treated as an estimate. If you need to perform tasks after the sonification has ended, it is recommended to use the `onEnd` event handler rather than relying on the duration.

The `pointPlayTime` parameter specifies how to map the time when points are played. In the example above we set this to `x`, meaning the x-data property will decide which points are played first, and how much time to leave between the points. If there is a gap in x-values, this will be reflected as a gap in time between played points.

For a full overview of the available options, see [Series.sonify](https://api.highcharts.com/class-reference/Highcharts.Series#sonify).

**Simple sonification of chart**

In this example we will show how to sonify a chart with multiple series using [Chart.sonify](https://api.highcharts.com/class-reference/Highcharts.Chart#sonify), and clarify the differences from sonifying single series.

```js  
// Set up a chart
var chart = Highcharts.chart('container', {
    // ...
});

// Click button to call chart.sonify()
document.getElementById('sonify').onclick = function () {
    chart.sonify({
        duration: 3000,
        order: 'sequential',
        pointPlayTime: 'x',
        afterSeriesWait: 1000,
        instruments: [{
            instrument: 'triangleMajor',
            instrumentMapping: {
                volume: 0.8,
                duration: 250,
                pan: 'x',
                frequency: 'y'
            },
            // Start at C5 note, end at C6
            instrumentOptions: {
                minFrequency: 520,
                maxFrequency: 1050
            }
        }]
    });
};
```      

<iframe style="width: 100%; height: 470px; border: none;" src=https://www.highcharts.com/samples/embed/highcharts/sonification/chart-sequential allow="fullscreen"></iframe>

In the above example we are calling [Chart.sonify](https://api.highcharts.com/class-reference/Highcharts.Chart#sonify) when a button is being pressed. The options are similar to those of [Series.sonify](https://api.highcharts.com/class-reference/Highcharts.Series#sonify), with a few additions.

The `order` option specifies the order in which the series are being played. This can either be `sequential`, `simultaneous` or an array with a custom ordering.

The `afterSeriesWait` option adds a silent wait after each series, to more easily distinguish between them.

For a full overview of the available options, see [Chart.sonify](https://api.highcharts.com/class-reference/Highcharts.Chart#sonify).

**Using Earcons**

In this example we will take a look at Earcons and how to use them in a chart.

```js     
Highcharts.chart('container', {
    // ...
    plotOptions: {
        series: {
            events: {
                click: function () {
                    // Sonify the series when clicked
                    this.sonify({
                        duration: 2000,
                        pointPlayTime: 'x',
                        instruments: [{
                            instrument: 'sineMajor',
                            instrumentMapping: {
                                volume: 0.8,
                                duration: 250,
                                pan: 'x',
                                frequency: 'y'
                            }
                        }],
                        earcons: [{
                            // Define the earcon we want to play
                            earcon: new Highcharts.sonification.Earcon({
                                // Global volume for earcon
                                volume: 0.3,
                                // Play two instruments for this earcon
                                instruments: [{
                                    instrument: 'triangleMajor',
                                    playOptions: {
                                        // Play a rising frequency
                                        frequency: function (time) {
                                            return time * 1760;
                                        },
                                        duration: 200,
                                        pan: 0.8 // Pan 80% right
                                    }
                                }, {
                                    instrument: 'triangleMajor',
                                    playOptions: {
                                        // Play another rising frequency
                                        frequency: function (time) {
                                            return time * 2217;
                                        },
                                        duration: 200,
                                        pan: -0.8 // Pan 80% left
                                    }
                                }]
                            }),
                            // Play this earcon if this point is crossing
                            // another series.
                            condition: function (point) {
                                var chart = point.series.chart;
                                // Go through the other series in the chart
                                // and see if there is a point with the same
                                // value. If so we return true, and the earcon
                                // is played.
                                return chart.series.some(function (series) {
                                    return series !== point.series &&
                                        series.points.some(function (p) {
                                            return p.y === point.y &&
                                                p.x === point.x;
                                        });
                                });
                            }
                        }]
                    });
                }
            }
        }
    }
});
```

<iframe style="width: 100%; height: 470px; border: none;" src=https://www.highcharts.com/samples/embed/highcharts/sonification/series-earcon allow="fullscreen"></iframe>

In the above example we use the same approach as with [Series.sonify](https://api.highcharts.com/class-reference/Highcharts.Series#sonify) above, calling `Series.sonify` when a series is clicked. In addition, we define an [Earcon](https://api.highcharts.com/class-reference/Highcharts.Earcon#Earcon).

An Earcon is mainly defined by providing a list of instruments and specifying how they should be played. Since an Earcon is a predefined sound, there is no mapping from data properties here. In the example above, we use two instruments. Both of the instruments are predefined, and referenced by name. The parameters for playing them are fixed for duration and panning, but for frequency we utilize a callback function. This callback function receives the relative time as a parameter, with the start of the Earcon playback being `0` and the end of the playback being `1`. We use this parameter to create a frequency ramp.

In addition to the instruments and the options for playing them we have to define when we want the Earcon to play. It is possible to attach the Earcon to a data point, but in this case we chose to use a callback function. This function receives a data point, and should return whether or not to play the Earcon for this point.

It is also possible to instantiate an Earcon object anywhere and call `Earcon.sonify()` on it in order to play the sound.

For a full overview of the available options, see [Earcon](https://api.highcharts.com/class-reference/Highcharts.Earcon#Earcon).

API documents
-------------

*   [Point.sonify](https://api.highcharts.com/class-reference/Highcharts.Point#sonify)
*   [Series.sonify](https://api.highcharts.com/class-reference/Highcharts.Series#sonify)
*   [Chart.sonify](https://api.highcharts.com/class-reference/Highcharts.Chart#sonify)
*   [Instrument](https://api.highcharts.com/class-reference/Highcharts.Instrument)
*   [Earcon](https://api.highcharts.com/class-reference/Highcharts.Earcon)
*   [Chart.cancelSonify](https://api.highcharts.com/class-reference/Highcharts.Chart#cancelSonify)
*   [Chart.getCurrentSonifyPoints](https://api.highcharts.com/class-reference/Highcharts.Chart#getCurrentSonifyPoints)
*   [Chart.pauseSonify](https://api.highcharts.com/class-reference/Highcharts.Chart#pauseSonify)
*   [Chart.resetSonifyCursor](https://api.highcharts.com/class-reference/Highcharts.Chart#resetSonifyCursor)
*   [Chart.resetSonifyCursorEnd](https://api.highcharts.com/class-reference/Highcharts.Chart#resetSonifyCursorEnd)
*   [Chart.resumeSonify](https://api.highcharts.com/class-reference/Highcharts.Chart#resumeSonify)
*   [Chart.rewindSonify](https://api.highcharts.com/class-reference/Highcharts.Chart#rewindSonify)
*   [Chart.setSonifyCursor](https://api.highcharts.com/class-reference/Highcharts.Chart#setSonifyCursor)
