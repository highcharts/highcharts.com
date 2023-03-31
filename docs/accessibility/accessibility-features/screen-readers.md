Screen Readers
===
One of the most well known assistive technologies in use by people with disabilities, a screen reader is a program that attempts to convey the information on the screen by using non-visual methods, such as text-to-speech. If your charts are using the Accessibility module, screen reader users can navigate and explore your charts. It will also help your SEO, as web crawlers can read the information provided for screen readers.

The first thing a screen reader user will encounter when exploring a chart is an information region. This region contains basic information about the chart, such as title, the type of chart, axis information, and the text description of the chart if provided (see [Accessibility Module - Basic configuration](https://www.highcharts.com/docs/accessibility/accessibility-module#basic-configuration)). The purpose of this region is to give the screen reader user sufficient information to let them make a decision on whether or not to invest more time exploring the chart.

If the screen reader user decides to explore the chart in more detail, they have the option of viewing the chart as a data table. Many users will however prefer navigating the chart elements themselves. Using the Accessibility module, the data points can be navigated, and the values will be accessible to the screen reader. By default, the data series are marked up as regions/landmarks, which aids navigation between series. The screen reader user is able to navigate the chart using their native screen reader commands, and does not have to learn a custom set of shortcuts and navigation keys.

Screen reader users are also able to interact with the elements and the chart menu. By interacting with the chart menu, they will be able to download the chart as an SVG, suitable for tactile printing.

If the chart enables drilldown or is otherwise updating its data dynamically, Highcharts can announce this to screen reader users, while giving you control over the frequency of announcements and their content. See [Dynamic data with the accessibility module](https://www.highcharts.com/docs/accessibility/accessible-dynamic-data) for more information.

The Accessibility module is compatible with most screen readers in modern browsers, including JAWS, NVDA, Narrator, VoiceOver, and TalkBack.


<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/8Sew47xr-EU" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
