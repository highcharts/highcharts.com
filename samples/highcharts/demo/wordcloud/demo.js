const text =
        'Chapter 1. Down the Rabbit-Hole ' +
        'Alice was beginning to get very tired of sitting by her sister on ' +
        'the bank, and of having nothing to do: ' +
        'once or twice she had peeped into the book her sister was reading, ' +
        'but it had no pictures or conversations ' +
        'in it, \'and what is the use of a book,\' thought Alice ' +
        '\'without pictures or conversation?\'' +
        'So she was considering in her own mind (as well as she could, for ' +
        'the hot day made her feel very sleepy ' +
        'and stupid), whether the pleasure of making a daisy-chain would be ' +
        'worth the trouble of getting up and picking ' +
        'the daisies, when suddenly a White Rabbit with pink eyes ran close ' +
        'by her.',
    lines = text.replace(/[():'?0-9]+/g, '').split(/[,\. ]+/g),
    data = lines.reduce((arr, word) => {
        let obj = Highcharts.find(arr, obj => obj.name === word);
        if (obj) {
            obj.weight += 1;
        } else {
            obj = {
                name: word,
                weight: 1
            };
            arr.push(obj);
        }
        return arr;
    }, []);

Highcharts.chart('container', {
    accessibility: {
        screenReaderSection: {
            beforeChartFormat: '<h5>{chartTitle}</h5>' +
                '<div>{chartSubtitle}</div>' +
                '<div>{chartLongdesc}</div>' +
                '<div>{viewTableButton}</div>'
        }
    },
    chart: {
        zooming: {
            type: 'xy'
        },
        panning: {
            enabled: true,
            type: 'xy'
        },
        panKey: 'shift'
    },
    series: [{
        type: 'wordcloud',
        data,
        name: 'Occurrences'
    }],
    title: {
        text: 'Wordcloud of Alice\'s Adventures in Wonderland',
        align: 'left'
    },
    subtitle: {
        text: 'An excerpt from chapter 1: Down the Rabbit-Hole',
        align: 'left'
    },
    tooltip: {
        headerFormat: '<span style="font-size: 16px"><b>{point.name}</b>' +
            '</span><br>'
    }
});
