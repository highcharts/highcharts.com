QUnit.test(
    'Hide dataLabels for points which is not visible (#4813)',
    function (assert) {
        var data = {
                'South-East Asia': {
                    'Sri Lanka': {
                        'Communicable & other Group I': '75.5',
                        Injuries: '89.0',
                        'Noncommunicable diseases': '501.2'
                    },
                    Bangladesh: {
                        'Noncommunicable diseases': '548.9',
                        Injuries: '64.0',
                        'Communicable & other Group I': '234.6'
                    },
                    Myanmar: {
                        'Communicable & other Group I': '316.4',
                        Injuries: '102.0',
                        'Noncommunicable diseases': '708.7'
                    },
                    Maldives: {
                        Injuries: '35.0',
                        'Noncommunicable diseases': '487.2',
                        'Communicable & other Group I': '59.2'
                    },
                    'Democratic People\'s Republic of Korea': {
                        Injuries: '91.9',
                        'Noncommunicable diseases': '751.4',
                        'Communicable & other Group I': '117.3'
                    },
                    Bhutan: {
                        Injuries: '142.2',
                        'Noncommunicable diseases': '572.8',
                        'Communicable & other Group I': '186.9'
                    },
                    Thailand: {
                        Injuries: '72.8',
                        'Communicable & other Group I': '123.3',
                        'Noncommunicable diseases': '449.1'
                    },
                    Nepal: {
                        'Noncommunicable diseases': '678.1',
                        Injuries: '88.7',
                        'Communicable & other Group I': '251.8'
                    },
                    'Timor-Leste': {
                        Injuries: '69.2',
                        'Noncommunicable diseases': '670.5',
                        'Communicable & other Group I': '343.5'
                    },
                    India: {
                        'Communicable & other Group I': '253.0',
                        Injuries: '115.9',
                        'Noncommunicable diseases': '682.3'
                    },
                    Indonesia: {
                        Injuries: '49.3',
                        'Noncommunicable diseases': '680.1',
                        'Communicable & other Group I': '162.4'
                    }
                },
                Europe: {
                    Hungary: {
                        'Communicable & other Group I': '16.8',
                        'Noncommunicable diseases': '602.8',
                        Injuries: '44.3'
                    },
                    Poland: {
                        'Communicable & other Group I': '22.6',
                        'Noncommunicable diseases': '494.5',
                        Injuries: '48.9'
                    },
                    Israel: {
                        'Communicable & other Group I': '31.2',
                        'Noncommunicable diseases': '311.2',
                        Injuries: '20.8'
                    },
                    France: {
                        'Communicable & other Group I': '21.4',
                        'Noncommunicable diseases': '313.2',
                        Injuries: '34.6'
                    },
                    Turkey: {
                        Injuries: '39.1',
                        'Communicable & other Group I': '43.9',
                        'Noncommunicable diseases': '555.2'
                    },
                    Kyrgyzstan: {
                        'Communicable & other Group I': '65.8',
                        Injuries: '65.1',
                        'Noncommunicable diseases': '835.4'
                    },
                    Croatia: {
                        'Communicable & other Group I': '12.2',
                        'Noncommunicable diseases': '495.8',
                        Injuries: '40.1'
                    },
                    Portugal: {
                        Injuries: '25.2',
                        'Communicable & other Group I': '39.9',
                        'Noncommunicable diseases': '343.3'
                    },
                    Greece: {
                        Injuries: '26.5',
                        'Noncommunicable diseases': '365.0',
                        'Communicable & other Group I': '24.1'
                    },
                    Italy: {
                        Injuries: '20.1',
                        'Communicable & other Group I': '15.5',
                        'Noncommunicable diseases': '303.6'
                    },
                    Belgium: {
                        'Communicable & other Group I': '27.8',
                        Injuries: '38.9',
                        'Noncommunicable diseases': '356.8'
                    },
                    Lithuania: {
                        'Noncommunicable diseases': '580.6',
                        'Communicable & other Group I': '25.5',
                        Injuries: '76.4'
                    },
                    Uzbekistan: {
                        'Communicable & other Group I': '85.8',
                        Injuries: '47.4',
                        'Noncommunicable diseases': '810.9'
                    },
                    Serbia: {
                        'Communicable & other Group I': '19.4',
                        Injuries: '32.0',
                        'Noncommunicable diseases': '657.7'
                    },
                    Austria: {
                        'Noncommunicable diseases': '359.5',
                        Injuries: '30.6',
                        'Communicable & other Group I': '12.6'
                    },
                    'Bosnia and Herzegovina': {
                        Injuries: '42.4',
                        'Noncommunicable diseases': '512.5',
                        'Communicable & other Group I': '20.0'
                    },
                    Slovakia: {
                        Injuries: '39.1',
                        'Communicable & other Group I': '35.3',
                        'Noncommunicable diseases': '532.5'
                    },
                    'The former Yugoslav republic of Macedonia': {
                        Injuries: '24.0',
                        'Communicable & other Group I': '16.9',
                        'Noncommunicable diseases': '636.5'
                    },
                    Sweden: {
                        'Communicable & other Group I': '19.3',
                        'Noncommunicable diseases': '333.5',
                        Injuries: '26.1'
                    },
                    'Russian Federation': {
                        'Noncommunicable diseases': '790.3',
                        'Communicable & other Group I': '73.8',
                        Injuries: '102.8'
                    },
                    'Republic of Moldova': {
                        'Noncommunicable diseases': '787.6',
                        Injuries: '75.7',
                        'Communicable & other Group I': '44.5'
                    },
                    Ireland: {
                        Injuries: '31.8',
                        'Communicable & other Group I': '21.5',
                        'Noncommunicable diseases': '343.9'
                    },
                    Estonia: {
                        Injuries: '47.0',
                        'Communicable & other Group I': '18.5',
                        'Noncommunicable diseases': '510.7'
                    },
                    Cyprus: {
                        'Noncommunicable diseases': '333.0',
                        Injuries: '26.6',
                        'Communicable & other Group I': '16.2'
                    },
                    Kazakhstan: {
                        'Noncommunicable diseases': '949.7',
                        Injuries: '101.6',
                        'Communicable & other Group I': '55.3'
                    },
                    Netherlands: {
                        'Noncommunicable diseases': '355.2',
                        Injuries: '22.3',
                        'Communicable & other Group I': '25.5'
                    },
                    Finland: {
                        'Noncommunicable diseases': '366.6',
                        Injuries: '38.7',
                        'Communicable & other Group I': '9.0'
                    },
                    Romania: {
                        'Noncommunicable diseases': '612.2',
                        Injuries: '40.7',
                        'Communicable & other Group I': '38.5'
                    },
                    Albania: {
                        'Noncommunicable diseases': '671.6',
                        Injuries: '48.0',
                        'Communicable & other Group I': '46.5'
                    },
                    Iceland: {
                        Injuries: '29.0',
                        'Noncommunicable diseases': '311.7',
                        'Communicable & other Group I': '14.0'
                    },
                    Azerbaijan: {
                        'Noncommunicable diseases': '664.3',
                        Injuries: '33.6',
                        'Communicable & other Group I': '70.8'
                    },
                    Tajikistan: {
                        Injuries: '51.6',
                        'Communicable & other Group I': '147.7',
                        'Noncommunicable diseases': '752.6'
                    },
                    Bulgaria: {
                        'Communicable & other Group I': '33.4',
                        Injuries: '36.4',
                        'Noncommunicable diseases': '638.2'
                    },
                    'United Kingdom of Great Britain and Northern Ireland': {
                        'Communicable & other Group I': '28.5',
                        Injuries: '21.5',
                        'Noncommunicable diseases': '358.8'
                    },
                    Spain: {
                        'Communicable & other Group I': '19.1',
                        Injuries: '17.8',
                        'Noncommunicable diseases': '323.1'
                    },
                    Ukraine: {
                        'Communicable & other Group I': '69.3',
                        Injuries: '67.3',
                        'Noncommunicable diseases': '749.0'
                    },
                    Norway: {
                        'Noncommunicable diseases': '336.6',
                        'Communicable & other Group I': '25.2',
                        Injuries: '25.6'
                    },
                    Denmark: {
                        Injuries: '22.5',
                        'Communicable & other Group I': '29.5',
                        'Noncommunicable diseases': '406.1'
                    },
                    Belarus: {
                        'Noncommunicable diseases': '682.5',
                        'Communicable & other Group I': '28.3',
                        Injuries: '91.3'
                    },
                    Malta: {
                        'Noncommunicable diseases': '364.5',
                        Injuries: '19.0',
                        'Communicable & other Group I': '23.6'
                    },
                    Latvia: {
                        'Noncommunicable diseases': '623.7',
                        Injuries: '54.5',
                        'Communicable & other Group I': '26.0'
                    },
                    Turkmenistan: {
                        Injuries: '93.0',
                        'Communicable & other Group I': '115.8',
                        'Noncommunicable diseases': '1025.1'
                    },
                    Switzerland: {
                        'Communicable & other Group I': '14.5',
                        'Noncommunicable diseases': '291.6',
                        Injuries: '25.4'
                    },
                    Luxembourg: {
                        Injuries: '31.1',
                        'Noncommunicable diseases': '317.8',
                        'Communicable & other Group I': '20.5'
                    },
                    Georgia: {
                        Injuries: '32.2',
                        'Communicable & other Group I': '39.3',
                        'Noncommunicable diseases': '615.2'
                    },
                    Slovenia: {
                        'Noncommunicable diseases': '369.2',
                        'Communicable & other Group I': '15.4',
                        Injuries: '44.2'
                    },
                    Montenegro: {
                        'Communicable & other Group I': '18.7',
                        'Noncommunicable diseases': '571.5',
                        Injuries: '41.2'
                    },
                    Armenia: {
                        'Noncommunicable diseases': '847.5',
                        'Communicable & other Group I': '45.0',
                        Injuries: '49.2'
                    },
                    Germany: {
                        Injuries: '23.0',
                        'Communicable & other Group I': '21.6',
                        'Noncommunicable diseases': '365.1'
                    },
                    'Czech Republic': {
                        Injuries: '39.1',
                        'Noncommunicable diseases': '460.7',
                        'Communicable & other Group I': '27.0'
                    }
                },
                Africa: {
                    'Equatorial Guinea': {
                        'Communicable & other Group I': '756.8',
                        Injuries: '133.6',
                        'Noncommunicable diseases': '729.0'
                    },
                    Madagascar: {
                        'Noncommunicable diseases': '648.6',
                        'Communicable & other Group I': '429.9',
                        Injuries: '89.0'
                    },
                    Swaziland: {
                        'Communicable & other Group I': '884.3',
                        Injuries: '119.5',
                        'Noncommunicable diseases': '702.4'
                    },
                    Congo: {
                        'Noncommunicable diseases': '632.3',
                        'Communicable & other Group I': '666.9',
                        Injuries: '89.0'
                    },
                    'Burkina Faso': {
                        'Communicable & other Group I': '648.2',
                        'Noncommunicable diseases': '784.0',
                        Injuries: '119.3'
                    },
                    'Guinea-Bissau': {
                        'Communicable & other Group I': '869.8',
                        'Noncommunicable diseases': '764.7',
                        Injuries: '111.6'
                    },
                    'Democratic Republic of the Congo': {
                        'Noncommunicable diseases': '724.4',
                        Injuries: '137.1',
                        'Communicable & other Group I': '920.7'
                    },
                    Mozambique: {
                        Injuries: '175.3',
                        'Noncommunicable diseases': '593.7',
                        'Communicable & other Group I': '998.1'
                    },
                    'Central African Republic': {
                        'Communicable & other Group I': '1212.1',
                        Injuries: '107.9',
                        'Noncommunicable diseases': '550.8'
                    },
                    'United Republic of Tanzania': {
                        'Noncommunicable diseases': '569.8',
                        'Communicable & other Group I': '584.2',
                        Injuries: '129.2'
                    },
                    Cameroon: {
                        'Communicable & other Group I': '768.8',
                        Injuries: '106.0',
                        'Noncommunicable diseases': '675.2'
                    },
                    Togo: {
                        'Noncommunicable diseases': '679.0',
                        'Communicable & other Group I': '681.8',
                        Injuries: '93.0'
                    },
                    Eritrea: {
                        Injuries: '118.7',
                        'Communicable & other Group I': '506.0',
                        'Noncommunicable diseases': '671.9'
                    },
                    Namibia: {
                        Injuries: '76.4',
                        'Noncommunicable diseases': '580.2',
                        'Communicable & other Group I': '356.6'
                    },
                    Senegal: {
                        'Noncommunicable diseases': '558.1',
                        Injuries: '89.3',
                        'Communicable & other Group I': '587.7'
                    },
                    Chad: {
                        'Communicable & other Group I': '1070.9',
                        Injuries: '114.5',
                        'Noncommunicable diseases': '712.6'
                    },
                    Benin: {
                        Injuries: '98.0',
                        'Noncommunicable diseases': '761.5',
                        'Communicable & other Group I': '577.3'
                    },
                    Zimbabwe: {
                        'Communicable & other Group I': '711.3',
                        Injuries: '82.5',
                        'Noncommunicable diseases': '598.9'
                    },
                    Rwanda: {
                        'Noncommunicable diseases': '585.3',
                        Injuries: '106.3',
                        'Communicable & other Group I': '401.7'
                    },
                    Zambia: {
                        'Noncommunicable diseases': '587.4',
                        Injuries: '156.4',
                        'Communicable & other Group I': '764.3'
                    },
                    Mali: {
                        Injuries: '119.5',
                        'Communicable & other Group I': '588.3',
                        'Noncommunicable diseases': '866.1'
                    },
                    Ethiopia: {
                        Injuries: '94.5',
                        'Communicable & other Group I': '558.9',
                        'Noncommunicable diseases': '476.3'
                    },
                    'South Africa': {
                        'Communicable & other Group I': '611.6',
                        Injuries: '103.5',
                        'Noncommunicable diseases': '710.9'
                    },
                    Burundi: {
                        Injuries: '146.6',
                        'Communicable & other Group I': '704.8',
                        'Noncommunicable diseases': '729.5'
                    },
                    'Cabo Verde': {
                        Injuries: '54.4',
                        'Noncommunicable diseases': '482.1',
                        'Communicable & other Group I': '141.9'
                    },
                    Liberia: {
                        'Noncommunicable diseases': '656.9',
                        Injuries: '83.3',
                        'Communicable & other Group I': '609.1'
                    },
                    Uganda: {
                        'Noncommunicable diseases': '664.4',
                        'Communicable & other Group I': '696.7',
                        Injuries: '166.8'
                    },
                    Mauritius: {
                        'Noncommunicable diseases': '576.5',
                        Injuries: '44.1',
                        'Communicable & other Group I': '61.8'
                    },
                    Algeria: {
                        'Noncommunicable diseases': '710.4',
                        Injuries: '53.8',
                        'Communicable & other Group I': '97.8'
                    },
                    'C\u00f4te d\'Ivoire': {
                        'Noncommunicable diseases': '794.0',
                        Injuries: '124.0',
                        'Communicable & other Group I': '861.3'
                    },
                    Malawi: {
                        Injuries: '97.7',
                        'Communicable & other Group I': '777.6',
                        'Noncommunicable diseases': '655.0'
                    },
                    Botswana: {
                        Injuries: '87.9',
                        'Noncommunicable diseases': '612.2',
                        'Communicable & other Group I': '555.3'
                    },
                    Guinea: {
                        Injuries: '96.0',
                        'Noncommunicable diseases': '681.1',
                        'Communicable & other Group I': '679.6'
                    },
                    Ghana: {
                        Injuries: '76.1',
                        'Noncommunicable diseases': '669.9',
                        'Communicable & other Group I': '476.0'
                    },
                    Kenya: {
                        'Noncommunicable diseases': '514.7',
                        Injuries: '101.1',
                        'Communicable & other Group I': '657.5'
                    },
                    Gambia: {
                        'Noncommunicable diseases': '629.6',
                        Injuries: '96.0',
                        'Communicable & other Group I': '590.5'
                    },
                    Angola: {
                        Injuries: '137.8',
                        'Noncommunicable diseases': '768.4',
                        'Communicable & other Group I': '873.3'
                    },
                    'Sierra Leone': {
                        'Communicable & other Group I': '1327.4',
                        'Noncommunicable diseases': '963.5',
                        Injuries: '149.5'
                    },
                    Mauritania: {
                        'Communicable & other Group I': '619.1',
                        Injuries: '83.4',
                        'Noncommunicable diseases': '555.1'
                    },
                    Comoros: {
                        'Communicable & other Group I': '494.6',
                        Injuries: '132.4',
                        'Noncommunicable diseases': '695.5'
                    },
                    Gabon: {
                        'Noncommunicable diseases': '504.6',
                        Injuries: '77.4',
                        'Communicable & other Group I': '589.4'
                    },
                    Niger: {
                        Injuries: '97.6',
                        'Communicable & other Group I': '740.0',
                        'Noncommunicable diseases': '649.1'
                    },
                    Lesotho: {
                        'Communicable & other Group I': '1110.5',
                        Injuries: '142.5',
                        'Noncommunicable diseases': '671.8'
                    },
                    Nigeria: {
                        'Noncommunicable diseases': '673.7',
                        'Communicable & other Group I': '866.2',
                        Injuries: '145.6'
                    }
                },
                Americas: {
                    Canada: {
                        'Noncommunicable diseases': '318.0',
                        Injuries: '31.3',
                        'Communicable & other Group I': '22.6'
                    },
                    'Bolivia (Plurinational State of)': {
                        'Communicable & other Group I': '226.2',
                        'Noncommunicable diseases': '635.3',
                        Injuries: '100.0'
                    },
                    Haiti: {
                        'Communicable & other Group I': '405.4',
                        'Noncommunicable diseases': '724.6',
                        Injuries: '89.3'
                    },
                    Belize: {
                        'Noncommunicable diseases': '470.7',
                        Injuries: '82.0',
                        'Communicable & other Group I': '104.6'
                    },
                    Suriname: {
                        Injuries: '70.5',
                        'Communicable & other Group I': '83.7',
                        'Noncommunicable diseases': '374.8'
                    },
                    Argentina: {
                        'Communicable & other Group I': '68.7',
                        Injuries: '50.7',
                        'Noncommunicable diseases': '467.3'
                    },
                    Mexico: {
                        Injuries: '63.2',
                        'Communicable & other Group I': '57.0',
                        'Noncommunicable diseases': '468.3'
                    },
                    Jamaica: {
                        Injuries: '51.5',
                        'Communicable & other Group I': '97.0',
                        'Noncommunicable diseases': '519.1'
                    },
                    Peru: {
                        'Noncommunicable diseases': '363.5',
                        Injuries: '47.9',
                        'Communicable & other Group I': '121.3'
                    },
                    Brazil: {
                        Injuries: '80.2',
                        'Communicable & other Group I': '92.8',
                        'Noncommunicable diseases': '513.8'
                    },
                    'Venezuela (Bolivarian Republic of)': {
                        'Communicable & other Group I': '58.2',
                        Injuries: '103.2',
                        'Noncommunicable diseases': '410.6'
                    },
                    Paraguay: {
                        'Noncommunicable diseases': '485.5',
                        'Communicable & other Group I': '77.3',
                        Injuries: '67.6'
                    },
                    Chile: {
                        'Noncommunicable diseases': '366.5',
                        'Communicable & other Group I': '36.3',
                        Injuries: '41.2'
                    },
                    'Trinidad and Tobago': {
                        'Noncommunicable diseases': '705.3',
                        'Communicable & other Group I': '80.4',
                        Injuries: '98.4'
                    },
                    Colombia: {
                        'Noncommunicable diseases': '377.3',
                        'Communicable & other Group I': '55.0',
                        Injuries: '72.6'
                    },
                    Cuba: {
                        Injuries: '45.3',
                        'Noncommunicable diseases': '421.8',
                        'Communicable & other Group I': '33.2'
                    },
                    'El Salvador': {
                        'Noncommunicable diseases': '474.9',
                        Injuries: '157.7',
                        'Communicable & other Group I': '96.2'
                    },
                    Honduras: {
                        Injuries: '80.8',
                        'Communicable & other Group I': '117.5',
                        'Noncommunicable diseases': '441.5'
                    },
                    Ecuador: {
                        'Noncommunicable diseases': '409.7',
                        Injuries: '83.7',
                        'Communicable & other Group I': '97.3'
                    },
                    'Costa Rica': {
                        'Communicable & other Group I': '30.5',
                        'Noncommunicable diseases': '391.8',
                        Injuries: '46.5'
                    },
                    'Dominican Republic': {
                        'Noncommunicable diseases': '396.0',
                        Injuries: '66.4',
                        'Communicable & other Group I': '76.8'
                    },
                    Nicaragua: {
                        'Communicable & other Group I': '75.2',
                        Injuries: '64.4',
                        'Noncommunicable diseases': '546.6'
                    },
                    Barbados: {
                        'Noncommunicable diseases': '404.5',
                        Injuries: '28.0',
                        'Communicable & other Group I': '60.8'
                    },
                    Uruguay: {
                        'Noncommunicable diseases': '446.0',
                        Injuries: '53.8',
                        'Communicable & other Group I': '46.2'
                    },
                    Panama: {
                        'Communicable & other Group I': '86.1',
                        Injuries: '67.4',
                        'Noncommunicable diseases': '372.9'
                    },
                    Bahamas: {
                        'Noncommunicable diseases': '465.2',
                        Injuries: '45.7',
                        'Communicable & other Group I': '122.0'
                    },
                    Guyana: {
                        'Communicable & other Group I': '177.2',
                        'Noncommunicable diseases': '1024.2',
                        Injuries: '150.0'
                    },
                    'United States of America': {
                        'Noncommunicable diseases': '412.8',
                        Injuries: '44.2',
                        'Communicable & other Group I': '31.3'
                    },
                    Guatemala: {
                        'Communicable & other Group I': '212.7',
                        'Noncommunicable diseases': '409.4',
                        Injuries: '111.0'
                    }
                },
                'Eastern Mediterranean': {
                    Egypt: {
                        'Communicable & other Group I': '74.3',
                        'Noncommunicable diseases': '781.7',
                        Injuries: '33.5'
                    },
                    'South Sudan': {
                        Injuries: '143.4',
                        'Communicable & other Group I': '831.3',
                        'Noncommunicable diseases': '623.4'
                    },
                    Sudan: {
                        Injuries: '133.6',
                        'Noncommunicable diseases': '551.0',
                        'Communicable & other Group I': '495.0'
                    },
                    Libya: {
                        Injuries: '62.8',
                        'Noncommunicable diseases': '550.0',
                        'Communicable & other Group I': '52.6'
                    },
                    Jordan: {
                        'Noncommunicable diseases': '640.3',
                        Injuries: '53.5',
                        'Communicable & other Group I': '52.5'
                    },
                    Pakistan: {
                        'Communicable & other Group I': '296.0',
                        'Noncommunicable diseases': '669.3',
                        Injuries: '98.7'
                    },
                    Djibouti: {
                        'Noncommunicable diseases': '631.1',
                        'Communicable & other Group I': '626.0',
                        Injuries: '106.0'
                    },
                    'Syrian Arab Republic': {
                        'Communicable & other Group I': '41.0',
                        Injuries: '308.0',
                        'Noncommunicable diseases': '572.7'
                    },
                    Morocco: {
                        'Noncommunicable diseases': '707.7',
                        'Communicable & other Group I': '131.5',
                        Injuries: '47.0'
                    },
                    Yemen: {
                        'Communicable & other Group I': '515.0',
                        'Noncommunicable diseases': '626.9',
                        Injuries: '84.3'
                    },
                    Bahrain: {
                        Injuries: '33.5',
                        'Noncommunicable diseases': '505.7',
                        'Communicable & other Group I': '48.5'
                    },
                    'United Arab Emirates': {
                        'Noncommunicable diseases': '546.8',
                        Injuries: '31.5',
                        'Communicable & other Group I': '35.6'
                    },
                    Lebanon: {
                        'Noncommunicable diseases': '384.6',
                        Injuries: '40.6',
                        'Communicable & other Group I': '30.5'
                    },
                    'Saudi Arabia': {
                        'Noncommunicable diseases': '549.4',
                        Injuries: '41.1',
                        'Communicable & other Group I': '71.3'
                    },
                    'Iran (Islamic Republic of)': {
                        Injuries: '74.9',
                        'Communicable & other Group I': '56.2',
                        'Noncommunicable diseases': '569.3'
                    },
                    Iraq: {
                        'Communicable & other Group I': '87.0',
                        'Noncommunicable diseases': '715.5',
                        Injuries: '128.5'
                    },
                    Qatar: {
                        'Communicable & other Group I': '28.3',
                        Injuries: '41.0',
                        'Noncommunicable diseases': '407.0'
                    },
                    Afghanistan: {
                        'Communicable & other Group I': '362.7',
                        Injuries: '169.2',
                        'Noncommunicable diseases': '846.3'
                    },
                    Somalia: {
                        'Noncommunicable diseases': '550.7',
                        'Communicable & other Group I': '927.2',
                        Injuries: '188.5'
                    },
                    Kuwait: {
                        'Communicable & other Group I': '82.5',
                        Injuries: '25.4',
                        'Noncommunicable diseases': '406.3'
                    },
                    Oman: {
                        Injuries: '52.8',
                        'Noncommunicable diseases': '478.2',
                        'Communicable & other Group I': '84.2'
                    },
                    Tunisia: {
                        'Noncommunicable diseases': '509.3',
                        'Communicable & other Group I': '65.0',
                        Injuries: '39.1'
                    }
                },
                'Western Pacific': {
                    Mongolia: {
                        Injuries: '69.4',
                        'Noncommunicable diseases': '966.5',
                        'Communicable & other Group I': '82.8'
                    },
                    Cambodia: {
                        Injuries: '62.2',
                        'Communicable & other Group I': '227.5',
                        'Noncommunicable diseases': '394.0'
                    },
                    Japan: {
                        Injuries: '40.5',
                        'Noncommunicable diseases': '244.2',
                        'Communicable & other Group I': '33.9'
                    },
                    'Brunei Darussalam': {
                        Injuries: '44.6',
                        'Noncommunicable diseases': '475.3',
                        'Communicable & other Group I': '56.1'
                    },
                    'Solomon Islands': {
                        'Communicable & other Group I': '230.6',
                        Injuries: '75.1',
                        'Noncommunicable diseases': '709.7'
                    },
                    'Viet Nam': {
                        'Communicable & other Group I': '96.0',
                        Injuries: '59.0',
                        'Noncommunicable diseases': '435.4'
                    },
                    'Lao People\'s Democratic Republic': {
                        'Communicable & other Group I': '328.7',
                        Injuries: '75.2',
                        'Noncommunicable diseases': '680.0'
                    },
                    China: {
                        'Communicable & other Group I': '41.4',
                        'Noncommunicable diseases': '576.3',
                        Injuries: '50.4'
                    },
                    'New Zealand': {
                        Injuries: '32.9',
                        'Noncommunicable diseases': '313.6',
                        'Communicable & other Group I': '18.0'
                    },
                    'Papua New Guinea': {
                        Injuries: '100.1',
                        'Communicable & other Group I': '554.3',
                        'Noncommunicable diseases': '693.2'
                    },
                    Philippines: {
                        'Communicable & other Group I': '226.4',
                        'Noncommunicable diseases': '720.0',
                        Injuries: '53.8'
                    },
                    Malaysia: {
                        Injuries: '62.8',
                        'Noncommunicable diseases': '563.2',
                        'Communicable & other Group I': '117.4'
                    },
                    Australia: {
                        'Communicable & other Group I': '13.7',
                        'Noncommunicable diseases': '302.9',
                        Injuries: '28.2'
                    },
                    Fiji: {
                        'Noncommunicable diseases': '804.0',
                        Injuries: '64.0',
                        'Communicable & other Group I': '105.2'
                    },
                    Singapore: {
                        'Communicable & other Group I': '66.2',
                        'Noncommunicable diseases': '264.8',
                        Injuries: '17.5'
                    },
                    'Republic of Korea': {
                        Injuries: '53.1',
                        'Communicable & other Group I': '33.8',
                        'Noncommunicable diseases': '302.1'
                    }
                }
            },
            chart,
            series,
            point,
            points = [],
            regionP,
            regionVal,
            regionI = 0,
            countryP,
            countryI,
            causeP,
            causeI,
            region,
            country,
            cause,
            causeName = {
                'Communicable & other Group I': 'Communicable diseases',
                'Noncommunicable diseases': 'Non-communicable diseases',
                Injuries: 'Injuries'
            };

        for (region in data) {
            if (Object.hasOwnProperty.call(data, region)) {
                regionVal = 0;
                regionP = {
                    id: 'id_' + regionI,
                    name: region,
                    color: Highcharts.getOptions().colors[regionI]
                };
                countryI = 0;
                for (country in data[region]) {
                    if (Object.hasOwnProperty.call(data[region], country)) {
                        countryP = {
                            id: regionP.id + '_' + countryI,
                            name: country,
                            parent: regionP.id
                        };
                        points.push(countryP);
                        causeI = 0;
                        for (cause in data[region][country]) {
                            if (Object.hasOwnProperty.call(
                                data[region][country],
                                cause
                            )) {
                                causeP = {
                                    id: countryP.id + '_' + causeI,
                                    name: causeName[cause],
                                    parent: countryP.id,
                                    value: Math.round(
                                        +data[region][country][cause]
                                    )
                                };
                                regionVal += causeP.value;
                                points.push(causeP);
                                causeI = causeI + 1;
                            }
                        }
                        countryI = countryI + 1;
                    }
                }
                regionP.value = Math.round(regionVal / countryI);
                points.push(regionP);
                regionI = regionI + 1;
            }
        }
        chart = Highcharts.chart('container', {
            series: [
                {
                    type: 'treemap',
                    layoutAlgorithm: 'squarified',
                    allowDrillToNode: true,
                    dataLabels: {
                        enabled: false
                    },
                    levelIsConstant: false,
                    levels: [
                        {
                            level: 1,
                            dataLabels: {
                                enabled: true
                            },
                            borderWidth: 3
                        }
                    ],
                    data: points
                }
            ],
            subtitle: {
                text:
                    'Click points to drill down. Source: <a href="http://apps.who.int/gho/data/node.main.12?lang=en">WHO</a>.'
            },
            title: {
                text: 'Global Mortality Rate 2012, per 100 000 population'
            }
        });
        series = chart.series[0];
        series.drillToNode('id_2');
        series.points.forEach(function (p) {
            if (p.name === 'Eastern Mediterranean') {
                point = p;
            }
        });
        assert.strictEqual(
            typeof point.dataLabel,
            'undefined',
            'Eastern Mediterranean should be destroyed.'
        );
    }
);

// Highcharts 4.1.1, Issue 3844
// treemap - colorByPoint is not working
QUnit.test(
    'Treemap: useHTML causes that data label is misplaced (#8159)', assert => {
        const chart = Highcharts.chart('container', {
                chart: {
                    width: 400,
                    height: 200
                },

                series: [
                    {
                        type: 'treemap',
                        dataLabels: {
                            useHTML: true,
                            borderWidth: 1,
                            borderColor: 'black'
                        },
                        layoutAlgorithm: 'stripes',
                        data: [
                            {
                                name: 'A',
                                value: 6,
                                colorValue: 1
                            },
                            {
                                name: `Bbbbbbbbbbbbb bbbbbbbbbbbbb Bbbbbbbbbbbbb
                                    bbbbbbbbbbbbb Bbbbbbbbbbbbb bbbbbbbbbbbbb`,
                                value: 6,
                                colorValue: 2
                            },
                            {
                                name: 'Ccccccccccc',
                                value: 4,
                                colorValue: 3
                            }
                        ]
                    }
                ]
            }),
            series = chart.series[0],
            point1Box = series.points[1].graphic.getBBox(),
            point1DL = series.points[1].dataLabel,
            point1DLabsBox = point1DL.absoluteBox,
            point2DL = series.points[2].dataLabel;

        assert.notStrictEqual(
            point2DL.visibility,
            'hidden',
            `The second point's data label shouldn't overlap (and hide) the
                third point's datalabel.`
        );

        assert.strictEqual(
            point1DL.getBBox(true).height >
                point1DL.text.getBBox(true).height,
            true,
            'Data label text (second point) should fit in its box.'
        );

        assert.close(
            point1DLabsBox.y + (point1DLabsBox.height / 2),
            point1Box.y + (point1Box.height / 2) + chart.plotTop,
            1,
            `Long data labels with useHTML: true should be middle-aligned
                (#18212).`
        );
    }
);

QUnit.test(
    'Treemap: data label exceeds point\'s boundaries (#8160)',
    function (assert) {
        var chart = Highcharts.chart('container', {
                chart: {
                    width: 600,
                    height: 300
                },
                series: [
                    {
                        type: 'treemap',
                        layoutAlgorithm: 'stripes',
                        dataLabels: {
                            useHTML: false
                        },
                        data: [
                            {
                                name: 'Aaa Aaa Aaa Aaa Aaa Aaa Aaa Aaa',
                                value: 6,
                                colorValue: 1
                            },
                            {
                                name: 'B',
                                value: 6,
                                colorValue: 2
                            },
                            {
                                name: 'Ccccccccccccccccccccccccc cccccccc',
                                value: 4,
                                colorValue: 3
                            },
                            {
                                name: 'D',
                                value: 3,
                                colorValue: 4
                            },
                            {
                                name: 'E',
                                value: 2,
                                colorValue: 5
                            },
                            {
                                name: 'F',
                                value: 2,
                                colorValue: 6
                            },
                            {
                                name: 'Gggggg',
                                value: 1,
                                colorValue: 7
                            }
                        ]
                    }
                ]
            }),
            series = chart.series[0],
            points = series.points,
            isLabelsWidthCorrect = true,
            dataLabel,
            width,
            i;

        for (i = 0; i < points.length; i++) {
            dataLabel = points[i].dataLabel;
            width = dataLabel.options.style.width;
            if (dataLabel.text.getBBox(true).width > width) {
                isLabelsWidthCorrect = false;
                break;
            }
        }

        assert.strictEqual(
            isLabelsWidthCorrect,
            true,
            'Data label text shouldn\'t be wider than its box (useHTML: false)'
        );

        series.update({
            dataLabels: {
                useHTML: true
            }
        });
        isLabelsWidthCorrect = true;
        points = series.points; // update the reference

        assert.strictEqual(
            points[0].dataLabel.text.element.nodeName.toLowerCase(),
            'span',
            'Data labels should change to HTML'
        );

        for (i = 0; i < points.length; i++) {
            dataLabel = points[i].dataLabel;
            width = dataLabel.options.style.width;
            if (dataLabel.text.element.scrollWidth > width) {
                isLabelsWidthCorrect = false;
                break;
            }
        }

        assert.strictEqual(
            isLabelsWidthCorrect,
            true,
            'Data label text shouldn\'t be wider than its box (useHTML: true)'
        );

        series.update({
            dataLabels: {
                useHTML: false
            }
        });

        assert.strictEqual(
            points[0].dataLabel.text.element.nodeName.toLowerCase(),
            'text',
            'Data labels should change to SVG'
        );

    }
);
