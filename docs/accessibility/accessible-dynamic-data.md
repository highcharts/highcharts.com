Accessible dynamic data
===

The Highcharts suite of products has extensive dynamic support. Changes to the layout, design, and data is supported after the chart has been created, using methods like [`chart.update`](https://api.highcharts.com/class-reference/Highcharts.Chart#update) and [`series.setData`](https://api.highcharts.com/class-reference/Highcharts.Series#setData). This gives us some interesting challenges for accessibility, particularly for non-visual users.

Since Highcharts version 7.1, the Accessibility module supports dynamic data. This includes support for changing the accessibility options dynamically, but more importantly it also supports announcing new chart data to screen reader users. Included with this is support for drilldown. When a screen reader user drills down to a new series, they will be notified of the new data in this series.

Announce new data
-----------------
To enable announcing new data and drilldown for your charts, set the [`accessibility.announceNewData.enabled`](https://api.highcharts.com/highcharts/accessibility.announceNewData.enabled) option.

```js
Highcharts.chart('container', {
    accessibility: {
        announceNewData: {
            enabled: true
        }
    },
    // ...
});
```

<iframe style="width: 100%; height: 470px; border: none;" src=https://www.highcharts.com/samples/embed/highcharts/accessibility/accessible-dynamic allow="fullscreen"></iframe>

[View demo code](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/accessibility/accessible-dynamic)

Note that this will only work for users of screen readers and similar assistive technology. The announcements are made accessible to screen readers, and the screen reader will let its user know that there is new data. By default, the screen reader user will be notified every time there is new data, a maximum of once every 5 seconds.

It is important to note that these announcements will generally not be useful if they are too frequent, and care has to be taken not to annoy the end user. For charts that are updating often, consider if you should make announcements in batches, and perhaps make snapshots of the data accessible.

Configure announcements
-----------------------
To configure the announcements, see [`accessibility.announceNewData`](https://api.highcharts.com/highcharts/accessibility.announceNewData) and [`lang.accessibility.announceNewData`](https://api.highcharts.com/highcharts/lang.accessibility.announceNewData). The contents of the announcements can be configured, as well as a minimum time interval that has to pass between announcements. It is also possible to configure whether or not the announcement should interrupt the user. For most use cases this is something you want to avoid, but it can be used for critical alerts.

By defining the [`accessibility.announceNewData.announcementFormatter`](https://api.highcharts.com/highcharts/accessibility.announceNewData.announcementFormatter) it is possible to add logic for which updates to make an announcement for. This enables you to for example only announce new data that is critical, or for a certain data series.

```js
function onAnnounce(updatedSeries, newSeries, newPoint) {
    return newPoint && newPoint.y > 10 ? 'Alert: ' + newPoint.y : '';
}

Highcharts.chart('container', {
    accessibility: {
        announceNewData: {
            interruptUser: true,
            announcementFormatter: onAnnounce
        }
    },
    // ...
});
```

<iframe style="width: 100%; height: 470px; border: none;" src=https://www.highcharts.com/samples/embed/highcharts/accessibility/custom-dynamic allow="fullscreen"></iframe>

[View demo code](https://jsfiddle.net/gh/get/library/pure/highcharts/highcharts/tree/master/samples/highcharts/accessibility/custom-dynamic)
