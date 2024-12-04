const container = document.getElementById('container');
const definedHeightCbx = document.getElementById('defined-height-cbx');
const heightSlider = document.getElementById('height-slider');
const heightSliderLabel = document.getElementById('height-slider-label');

DataGrid.dataGrid(container, {
    dataTable: {
        columns: {
            no: Array.from({ length: 400 }, (_, i) => i + 1),
            product: Array.from({ length: 100 }, () =>
                ['Apples', 'Pears', 'Plums', 'Bananas']
            ).flat(),
            weight: Array.from({ length: 100 }, () =>
                [100, 40, 0.5, 200]
            ).flat(),
            price: Array.from({ length: 100 }, () =>
                [1.5, 2.53, 5, 4.5]
            ).flat(),
            metaData: Array.from({ length: 100 }, () =>
                ['a', 'b', 'c', 'd']
            ).flat()
        }
    }
});

definedHeightCbx.addEventListener('change', () => {
    const unchecked = heightSlider.disabled = !definedHeightCbx.checked;
    heightSliderLabel.textContent = container.style.height =
        unchecked ? 'auto' : `${heightSlider.value}px`;
});

heightSlider.addEventListener('input', () => {
    heightSliderLabel.textContent =
        container.style.height = `${heightSlider.value}px`;
});
