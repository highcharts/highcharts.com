const container = document.getElementById('container');
const definedHeightCbx = document.getElementById('defined-height-cbx');
const heightSlider = document.getElementById('height-slider');
const heightSliderLabel = document.getElementById('height-slider-label');

Grid.grid(container, {
    dataTable: {
        columns: {
            product: ['Apples', 'Pears', 'Plums', 'Bananas'],
            weight: [100, 40, 0.5, 200],
            price: [1.5, 2.53, 5, 4.5],
            metaData: ['a', 'b', 'c', 'd'],
            icon: ['Apples URL', 'Pears URL', 'Plums URL', 'Bananas URL']
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
