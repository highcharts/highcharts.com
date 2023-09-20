Highcharts.setOptions({ // Apply the exporting height to print as well
    chart: {
        events: {
            beforePrint: function () {
                const height = this.options.exporting.chartOptions.chart.height;
                if (height) {
                    this.resetParams = [
                        this.chartWidth,
                        this.chartHeight,
                        false];
                    this.setSize(this.chartWidth, height, false);
                }
            },
            afterPrint: function () {
                if (this.options.exporting.chartOptions.chart.height) {
                    this.setSize.apply(this, this.resetParams);
                }
            }
        }
    }
});

Highcharts.chart('container', {

    chart: {
        type: 'pie',
        width: 500,
        borderWidth: 2
    },

    title: {
        text: 'Legend navigation disabled in export'
    },

    credits: {
        enabled: false
    },

    legend: {
        layout: 'vertical',
        align: 'right',
        verticalAlign: 'top',
        y: 30,
        navigation: {
            activeColor: '#3E576F',
            animation: true,
            arrowSize: 12,
            inactiveColor: '#CCC',
            style: {
                fontWeight: 'bold',
                color: '#333',
                fontSize: '12px'
            }
        }
    },

    series: [{
        data: (function () {
            const names = 'Ari,Bjartur,Bogi,Bragi,Dánjal,Dávur,Eli,Emil,Fróði,Hákun,Hanus,Hjalti,Ísakur,' +
                'Johan,Jóhan,Julian,Kristian,Leon,Levi,Magnus,Martin,Mattias,Mikkjal,Nóa,Óli,Pauli,Petur,Rói,Sveinur,Teitur',
                arr = [];

            names.split(',').forEach(function (name) {
                arr.push({
                    name: name,
                    y: Math.round(Math.random() * 100)
                });
            });

            return arr;
        }()),
        showInLegend: true
    }],

    // In export, increase the chart height to disable navigation
    exporting: {
        chartOptions: {
            chart: {
                height: 650
            }
        }
    }

});