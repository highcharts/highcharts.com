(async () => {

    const csv = await fetch(
        'https://cdn.jsdelivr.net/gh/datasets/s-and-p-500-companies-financials/data/constituents-financials.csv'
    ).then(response => response.text());

    const dataParser = new Highcharts.Data({ csv });

    const csvData = dataParser.columns[0]
        .map((_, i) => dataParser.columns.reduce((obj, column) => {
            obj[column[0]] = column[i];
            return obj;
        }, {}));

    // Create the industries for the top level
    const data = [{
        id: 'Technology'
    }, {
        id: 'Financial'
    }, {
        id: 'Consumer Cyclical'
    }, {
        id: 'Communication Services'
    }, {
        id: 'Healthcare'
    }, {
        id: 'Consumer Defensive'
    }, {
        id: 'Industrials'
    }, {
        id: 'Real Estate'
    }, {
        id: 'Energy'
    }, {
        id: 'Utilities'
    }, {
        id: 'Basic Materials'
    }];

    // Create a static mapping object where of the sectors above is
    // mapped to an industry in the industries array.
    const sectorToIndustry = {
        'Industrial Conglomerates': 'Industrials',
        'Building Products': 'Industrials',
        'Health Care Equipment': 'Healthcare',
        Biotechnology: 'Healthcare',
        'IT Consulting & Other Services': 'Technology',
        'Application Software': 'Technology',
        Semiconductors: 'Technology',
        'Independent Power Producers & Energy Traders': 'Energy',
        'Life & Health Insurance': 'Financial',
        'Life Sciences Tools & Services': 'Healthcare',
        'Industrial Gases': 'Basic Materials',
        'Hotels, Resorts & Cruise Lines': 'Consumer Cyclical',
        'Internet Services & Infrastructure': 'Technology',
        'Specialty Chemicals': 'Basic Materials',
        'Office REITs': 'Real Estate',
        'Health Care Supplies': 'Healthcare',
        'Electric Utilities': 'Utilities',
        'Property & Casualty Insurance': 'Financial',
        'Interactive Media & Services': 'Communication Services',
        Tobacco: 'Consumer Defensive',
        'Broadline Retail': 'Consumer Cyclical',
        'Paper & Plastic Packaging Products & Materials': 'Basic Materials',
        'Diversified Support Services': 'Industrials',
        'Multi-Utilities': 'Utilities',
        'Consumer Finance': 'Financial',
        'Multi-line Insurance': 'Financial',
        'Telecom Tower REITs': 'Real Estate',
        'Water Utilities': 'Utilities',
        'Asset Management & Custody Banks': 'Financial',
        'Electrical Components & Equipment': 'Industrials',
        'Electronic Components': 'Technology',
        'Insurance Brokers': 'Financial',
        'Oil & Gas Exploration & Production': 'Energy',
        'Technology Hardware, Storage & Peripherals': 'Technology',
        'Semiconductor Materials & Equipment': 'Technology',
        'Automotive Parts & Equipment': 'Consumer Cyclical',
        'Agricultural Products & Services': 'Consumer Defensive',
        'Communications Equipment': 'Technology',
        'Integrated Telecommunication Services': 'Communication Services',
        'Gas Utilities': 'Utilities',
        'Human Resource & Employment Services': 'Industrials',
        'Automotive Retail': 'Consumer Cyclical',
        'Multi-Family Residential REITs': 'Real Estate',
        'Aerospace & Defense': 'Industrials',
        'Oil & Gas Equipment & Services': 'Energy',
        'Metal, Glass & Plastic Containers': 'Basic Materials',
        'Diversified Banks': 'Financial',
        'Multi-Sector Holdings': 'Financial',
        'Computer & Electronics Retail': 'Consumer Cyclical',
        Pharmaceuticals: 'Healthcare',
        'Data Processing & Outsourced Services': 'Technology',
        'Distillers & Vintners': 'Consumer Defensive',
        'Air Freight & Logistics': 'Industrials',
        'Casinos & Gaming': 'Consumer Cyclical',
        'Packaged Foods & Meats': 'Consumer Defensive',
        'Health Care Distributors': 'Healthcare',
        'Construction Machinery & Heavy Transportation Equipment':
            'Industrials',
        'Financial Exchanges & Data': 'Financial',
        'Real Estate Services': 'Real Estate',
        'Technology Distributors': 'Technology',
        'Managed Health Care': 'Healthcare',
        'Fertilizers & Agricultural Chemicals': 'Basic Materials',
        'Investment Banking & Brokerage': 'Financial',
        'Cable & Satellite': 'Communication Services',
        'Integrated Oil & Gas': 'Energy',
        Restaurants: 'Consumer Cyclical',
        'Household Products': 'Consumer Defensive',
        'Health Care Services': 'Healthcare',
        'Regional Banks': 'Financial',
        'Soft Drinks & Non-alcoholic Beverages': 'Consumer Defensive',
        'Transaction & Payment Processing Services': 'Technology',
        'Consumer Staples Merchandise Retail': 'Consumer Defensive',
        'Systems Software': 'Technology',
        'Rail Transportation': 'Industrials',
        Homebuilding: 'Consumer Cyclical',
        Footwear: 'Consumer Cyclical',
        'Agricultural & Farm Machinery': 'Consumer Cyclical',
        'Passenger Airlines': 'Industrials',
        'Data Center REITs': 'Real Estate',
        'Industrial Machinery & Supplies & Components': 'Industrials',
        'Commodity Chemicals': 'Basic Materials',
        'Interactive Home Entertainment': 'Communication Services',
        'Research & Consulting Services': 'Industrials',
        'Personal Care Products': 'Consumer Defensive',
        Reinsurance: 'Financial',
        'Self-Storage REITs': 'Real Estate',
        'Trading Companies & Distributors': 'Industrials',
        'Retail REITs': 'Real Estate',
        'Automobile Manufacturers': 'Consumer Cyclical',
        Broadcasting: 'Communication Services',
        Copper: 'Basic Materials',
        'Consumer Electronics': 'Technology',
        'Heavy Electrical Equipment': 'Industrials',
        Distributors: 'Industrials',
        'Leisure Products': 'Consumer Cyclical',
        'Health Care Facilities': 'Healthcare',
        'Health Care REITs': 'Real Estate',
        'Home Improvement Retail': 'Consumer Cyclical',
        'Hotel & Resort REITs': 'Real Estate',
        Advertising: 'Communication Services',
        'Single-Family Residential REITs': 'Real Estate',
        'Other Specialized REITs': 'Real Estate',
        'Cargo Ground Transportation': 'Industrials',
        'Electronic Manufacturing Services': 'Technology',
        'Construction & Engineering': 'Industrials',
        'Electronic Equipment & Instruments': 'Technology',
        'Oil & Gas Storage & Transportation': 'Energy',
        'Food Retail': 'Consumer Defensive',
        'Movies & Entertainment': 'Communication Services',
        'Apparel, Accessories & Luxury Goods': 'Consumer Cyclical',
        'Oil & Gas Refining & Marketing': 'Energy',
        'Construction Materials': 'Basic Materials',
        'Home Furnishings': 'Consumer Cyclical',
        Brewers: 'Consumer Defensive',
        Gold: 'Basic Materials',
        Publishing: 'Communication Services',
        Steel: 'Basic Materials',
        'Industrial REITs': 'Real Estate',
        'Environmental & Facilities Services': 'Industrials',
        'Apparel Retail': 'Consumer Cyclical',
        'Health Care Technology': 'Healthcare',
        'Food Distributors': 'Consumer Defensive',
        'Wireless Telecommunication Services': 'Communication Services',
        'Other Specialty Retail': 'Consumer Cyclical',
        'Passenger Ground Transportation': 'Industrials',
        'Drug Retail': 'Consumer Cyclical',
        'Timber REITs': 'Real Estate'
    };


    // Create the sectors for the second level
    csvData.forEach(row => {
        const sector = row.Sector;
        if (!data.find(point => point.id === sector)) {
            data.push({
                id: sector,
                parent: sectorToIndustry[sector]
            });
        }
    });

    // Register name for the categories and sectors
    data.forEach(point => {
        point.name = point.id;
    });

    csvData
        // Google class C usually left out in visualizations like this
        .filter(row => row.Symbol !== 'GOOG')
        .forEach(row => {
            const change = 10 * (Math.random() - 0.5);
            data.push({
                name: row.Name,
                id: row.Symbol,
                value: parseFloat(row['Market Cap']),
                parent: row.Sector,
                colorValue: change,
                custom: {
                    change: (change < 0 ? '' : '+') + change.toFixed(2) + '%'
                }
            });
        });

    Highcharts.chart('container', {
        series: [{
            name: 'All',
            type: 'treemap',
            layoutAlgorithm: 'squarified',
            allowDrillToNode: true,
            animationLimit: 1000,
            borderRadius: 3,
            // borderColor: '#252931',
            color: '#252931',
            dataLabels: {
                enabled: false,
                style: {
                    fontSize: '0.9em'
                }
            },
            opacity: 0.01,
            // sizeBy: 'leaf',
            levels: [{
                level: 1,
                dataLabels: {
                    enabled: true,
                    align: 'left',
                    inside: false,
                    style: {
                        // color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.7em',
                        lineClamp: 1,
                        // textOutline: '2px #252931',
                        textTransform: 'uppercase'
                    },
                    padding: 3
                },
                borderWidth: 3,
                levelIsConstant: false
            }, {
                level: 2,
                dataLabels: {
                    enabled: true,
                    inside: false,
                    align: 'left',
                    style: {
                        fontWeight: 'normal',
                        fontSize: '0.6em',
                        lineClamp: 1,
                        textOutline: 'none',
                        textTransform: 'uppercase'
                    }
                },
                groupPadding: 1

            // The companies
            }, {
                level: 3,
                dataLabels: {
                    enabled: true,
                    format: '{point.id}<br><span style="font-size: 0.7em">' +
                        '{point.custom.change}</span>',
                    style: {
                        color: 'white'
                    }
                }
            }],
            accessibility: {
                exposeAsGroupOnly: true
            },
            data
        }],
        subtitle: {
            text: 'Click points to drill down. Source: <a href="http://okfn.org/">okfn.org</a>.',
            align: 'left'
        },
        title: {
            text: 'S&P 500 Companies',
            align: 'left'
        },
        tooltip: {
            headerFormat:
                '<span style="font-size: 0.9em">{point.key}</span><br/>',
            pointFormat: '<b>Market Cap:</b>' +
                ' USD {(divide point.value 1000000000):.1f} bln<br/>' +
                '{#if point.custom.change}' +
                '<b>Change:</b> {point.custom.change}{/if}'
        },
        colorAxis: {
            dataClasses: [{
                from: -999,
                to: -2.5,
                color: '#f73539',
                name: '< -3%'
            }, {
                from: -2.5,
                to: -1.5,
                color: '#bf4044',
                name: '-2%'
            }, {
                from: -1.5,
                to: -0.5,
                color: '#8a444e',
                name: '-1%'
            },
            {
                from: -0.5,
                to: 0.5,
                color: '#414555',
                name: '0%'
            },
            {
                from: 0.5,
                to: 1.5,
                color: '#33774e',
                name: '1%'
            },
            {
                from: 1.5,
                to: 2.5,
                color: '#309e4e',
                name: '2%'
            },
            {
                from: 2.5,
                to: 999,
                color: '#2ecc59',
                name: '> 3%'
            }]
        }
    });
})();
