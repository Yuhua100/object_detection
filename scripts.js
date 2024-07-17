document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('video');

    fetch('results.json')
        .then(response => response.json())
        .then(data => {
            console.log("Loaded data:", data); // 检查 JSON 数据结构

            const videoKey = "./video_encoded.mp4";
            if (!data[videoKey]) {
                throw new Error(`No data found for video key: ${videoKey}`);
            }

            const videoResults = data[videoKey];
            const timeOffsets = videoResults.time_offset;
            const bodySwingTest = videoResults.bodyswingtest;

            console.log("Time Offsets:", timeOffsets);
            console.log("Body Swing Test:", bodySwingTest);

            if (!timeOffsets || !bodySwingTest) {
                throw new Error('Missing required properties in video results');
            }

            const cumulativeCounts = calculateCumulativeCounts(bodySwingTest, timeOffsets);

            console.log('Cumulative counts:', cumulativeCounts);  // 检查累计计数

            initializeCharts(cumulativeCounts, timeOffsets);
        })
        .catch(error => {
            console.error("Error loading or parsing results.json:", error);
        });

    function calculateCumulativeCounts(predictions, timeOffsets) {
        const cumulativeCounts = {
            "Mouse": [],
            "Hindpaw-clasp": [],
            "Immobile": [],
            "LeftSwing": [],
            "RightSwing": []
        };

        let counts = {
            "Mouse": 0,
            "Hindpaw-clasp": 0,
            "Immobile": 0,
            "LeftSwing": 0,
            "RightSwing": 0
        };

        timeOffsets.forEach((time, index) => {
            if (predictions[index] && predictions[index].predictions) {
                predictions[index].predictions.forEach(prediction => {
                    const className = prediction.class;
                    if (counts.hasOwnProperty(className)) {
                        counts[className] += 1;
                    }
                });
            }
            for (const className in counts) {
                if (counts.hasOwnProperty(className)) {
                    cumulativeCounts[className].push(counts[className]);
                }
            }
        });

        return cumulativeCounts;
    }

    function initializeCharts(cumulativeCounts, timeOffsets) {
        const chartConfigs = [
            { id: 'MouseChart', label: 'Mouse', color: 'blue' },
            { id: 'HindpawClaspChart', label: 'Hindpaw-clasp', color: 'orange' },
            { id: 'ImmobileChart', label: 'Immobile', color: 'green' },
            { id: 'LeftSwingChart', label: 'LeftSwing', color: 'purple' },
            { id: 'RightSwingChart', label: 'RightSwing', color: 'red' }
        ];

        chartConfigs.forEach(config => {
            const trace = {
                x: [0],
                y: [0],
                mode: 'lines+markers',
                name: config.label,
                line: { color: config.color }
            };

            const layout = {
                title: `Cumulative Counts of ${config.label} Over Time`,
                xaxis: { title: 'Time (seconds)', rangemode: 'tozero' },
                yaxis: { title: 'Cumulative Count', rangemode: 'tozero' },
                showlegend: true
            };

            Plotly.newPlot(config.id, [trace], layout);
        });

        video.addEventListener('timeupdate', function () {
            const currentTime = video.currentTime;
            const index = timeOffsets.findIndex(time => time >= currentTime);
            if (index !== -1) {
                updateCharts(cumulativeCounts, index, timeOffsets, chartConfigs);
            }
        });
    }

    function updateCharts(cumulativeCounts, index, timeOffsets, chartConfigs) {
        chartConfigs.forEach(config => {
            const update = {
                x: [timeOffsets.slice(0, index + 1)],
                y: [cumulativeCounts[config.label].slice(0, index + 1)]
            };

            Plotly.update(config.id, update, {}, [0]);
        });
    }
});
