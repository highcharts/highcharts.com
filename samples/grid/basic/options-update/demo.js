/* eslint-disable max-len */

const initialOptions = {
    columnDefaults: {
        cells: {
            editable: true
        }
    },
    columns: [{
        id: 'weight',
        className: 'custom-column-class-name',
        cells: {
            format: 'V: ${value}'
        }
    }, {
        id: 'metaData',
        enabled: false
    }]
};

const grid = Grid.grid('container', {
    dataTable: {
        columns: {
            product: [
                'Apples', 'Pears', 'Plums', 'Bananas', 'Oranges', 'Grapes', 'Peaches', 'Cherries', 'Strawberries', 'Blueberries',
                'Raspberries', 'Blackberries', 'Kiwis', 'Mangoes', 'Pineapples', 'Watermelons', 'Cantaloupes', 'Lemons', 'Limes', 'Grapefruits',
                'Pomegranates', 'Papayas', 'Passion Fruits', 'Dragon Fruits', 'Coconuts', 'Avocados', 'Dates', 'Figs', 'Guavas', 'Jackfruits',
                'Lychees', 'Nectarines', 'Tangerines', 'Mandarins', 'Persimmons', 'Pluots', 'Pomelos', 'Quinces', 'Starfruits', 'Ugli Fruits',
                'Mulberries', 'Gooseberries', 'Cranberries', 'Currants', 'Elderberries', 'Boysenberries', 'Salak', 'Soursops', 'Tamarillos', 'Yuzu'
            ],
            weight: [
                100, 40, 0.5, 200, 150, 75, 85, 10, 20, 30,
                25, 15, 50, 60, 70, 120, 130, 140, 35, 45,
                55, 65, 80, 90, 100, 110, 115, 125, 135, 145,
                155, 165, 175, 185, 195, 105, 215, 225, 235, 245,
                255, 265, 275, 285, 295, 305, 315, 325, 335, 345
            ],
            price: [
                1.5, 2.53, 5, 4.5, 1.2, 2.1, 3.0, 4.0, 1.8, 2.7,
                3.5, 4.2, 2.3, 1.7, 3.8, 2.6, 3.9, 4.1, 2.8, 1.9,
                2.4, 3.2, 4.3, 2.9, 1.4, 3.1, 4.4, 2.2, 1.6, 3.3,
                4.6, 2.5, 3.4, 1.1, 3.6, 1.3, 4.7, 1.0, 3.7, 4.8,
                2.0, 4.9, 2.15, 3.25, 1.75, 2.35, 3.45, 1.55, 4.05, 2.65
            ],
            metaData: [
                'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j',
                'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't',
                'u', 'v', 'w', 'x', 'y', 'z', 'aa', 'bb', 'cc', 'dd',
                'ee', 'ff', 'gg', 'hh', 'ii', 'jj', 'kk', 'll', 'mm', 'nn',
                'oo', 'pp', 'qq', 'rr', 'ss', 'tt', 'uu', 'vv', 'ww', 'xx'
            ],
            icon: [
                'Apples URL', 'Pears URL', 'Plums URL', 'Bananas URL', 'Oranges URL', 'Grapes URL', 'Peaches URL', 'Cherries URL', 'Strawberries URL', 'Blueberries URL',
                'Raspberries URL', 'Blackberries URL', 'Kiwis URL', 'Mangoes URL', 'Pineapples URL', 'Watermelons URL', 'Cantaloupes URL', 'Lemons URL', 'Limes URL', 'Grapefruits URL',
                'Pomegranates URL', 'Papayas URL', 'Passion Fruits URL', 'Dragon Fruits URL', 'Coconuts URL', 'Avocados URL', 'Dates URL', 'Figs URL', 'Guavas URL', 'Jackfruits URL',
                'Lychees URL', 'Nectarines URL', 'Tangerines URL', 'Mandarins URL', 'Persimmons URL', 'Pluots URL', 'Pomelos URL', 'Quinces URL', 'Starfruits URL', 'Ugli Fruits URL',
                'Mulberries URL', 'Gooseberries URL', 'Cranberries URL', 'Currants URL', 'Elderberries URL', 'Boysenberries URL', 'Salak URL', 'Soursops URL', 'Tamarillos URL', 'Yuzu URL'
            ]
        }
    },
    ...initialOptions
});

document.getElementById('options-textarea').value = JSON.stringify(
    initialOptions, null, 2
);

document.getElementById('update').addEventListener('submit', e => {
    e.preventDefault();

    let options;
    try {
        options = JSON.parse(document.getElementById('options-textarea').value);
    } catch {
        alert('Invalid JSON');
        return;
    }

    grid.update(options);
});
