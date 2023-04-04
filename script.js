import stands from "./stands.json" assert { type: "json" };

const standStats = Object.freeze(["E", "D", "C", "B", "A", "Infinite"]);
const propertiesOrder = Object.freeze([
	"speed",
	"range",
	"durability",
	"precision",
	"potential",
	"power",
]);

/**
 * @param {string} url
 */
function readStats(url) {
	const regex =
		/^(?:https?:\/\/)?charts\.idrlabs\.com\/graphic\/autism-spectrum\?\d?(?:&l=[A-Z]{2})?&p=(\d{1,3}),(\d{1,3}),(\d{1,3}),(\d{1,3}),(\d{1,3}),(\d{1,3}),(\d{1,3}),(\d{1,3}),(\d{1,3}),(\d{1,3})(?:&l=[A-Z]{2})?$/;

	const match = url.match(regex);
	if (!match) {
		throw new Error("Invalid URL");
	}

	return match.slice(1).map(Number);
}

/**
 * @param {number[]} stats
 */
function convertStats(stats) {
	const power = Math.floor(((stats[0] + stats[1]) / 200) * 5);
	const speed = Math.floor(((stats[2] * 2 + stats[3]) / 300) * 5);
	const range = Math.floor(((stats[3] + stats[4] * 2) / 300) * 5);
	const durability = Math.floor(((stats[5] + stats[6]) / 200) * 5);
	const precision = Math.floor(((stats[7] * 2 + stats[8]) / 300) * 5);
	const potential = Math.floor(((stats[8] + stats[9] * 2) / 300) * 5);

	return { power, speed, range, durability, precision, potential };
}

/**
 * @param {{
 * power: number,
 * speed: number,
 * range: number,
 * durability: number,
 * precision: number,
 * potential: number
 * }} stats
 */
function getStand(stats) {
	let [stand, score] = [null, Infinity];
	stands.forEach((currentStand) => {
		let standScore = 0;

		standScore += (currentStand.power - stats.power) ** 2;
		standScore += (currentStand.speed - stats.speed) ** 2;
		standScore += (currentStand.range - stats.range) ** 2;
		standScore += (currentStand.durability - stats.durability) ** 2;
		standScore += (currentStand.precision - stats.precision) ** 2;
		standScore += (currentStand.potential - stats.potential) ** 2;

		if (standScore < score) {
			[stand, score] = [currentStand, standScore];
		}
	});

	return stand;
}

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{
 * power: number,
 * speed: number,
 * range: number,
 * durability: number,
 * precision: number,
 * potential: number
 * }} stats
 */
function drawChart(canvas, stats) {
	const ctx = canvas.getContext("2d");

	const hexSpace = (2 * Math.PI) / 6;
	const linesSpace = (2 * Math.PI) / 22;
	const hexMaxRadius = 100;
	const outerCircleRadius = 150;
	const innerCircleRadius = 140;

	ctx.fillStyle = "#ffffff";
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.arc(
		canvas.width / 2,
		canvas.height / 2,
		outerCircleRadius,
		0,
		2 * Math.PI
	);
	ctx.stroke();

	ctx.lineWidth = 4;
	for (let i = 0; i < 22; i++) {
		ctx.beginPath();
		ctx.moveTo(
			canvas.width / 2 + outerCircleRadius * Math.sin(linesSpace * i),
			canvas.height / 2 + outerCircleRadius * Math.cos(linesSpace * i)
		);

		ctx.lineTo(
			canvas.width / 2 + innerCircleRadius * Math.sin(linesSpace * i),
			canvas.height / 2 + innerCircleRadius * Math.cos(linesSpace * i)
		);

		ctx.stroke();
	}

	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.arc(
		canvas.width / 2,
		canvas.height / 2,
		innerCircleRadius,
		0,
		2 * Math.PI
	);
	ctx.stroke();

	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.arc(canvas.width / 2, canvas.height / 2, hexMaxRadius, 0, 2 * Math.PI);
	ctx.stroke();

	ctx.fillStyle = "#ff000088";
	ctx.beginPath();
	for (let i = 0; i < 6; i++) {
		const property = propertiesOrder[i];
		const stat = stats[property];
		const chartHeight = (hexMaxRadius / 6) * (stat + 1);

		ctx.lineTo(
			canvas.width / 2 + chartHeight * Math.sin(hexSpace * i),
			canvas.height / 2 + chartHeight * Math.cos(hexSpace * i)
		);
	}

	ctx.closePath();
	ctx.fill();

	ctx.font = "Bold 20px Arial";
	ctx.fillStyle = "#000000";
	ctx.textAlign = "center";
	ctx.textBaseline = "middle";
	for (let i = 0; i < 6; i++) {
		const property = propertiesOrder[i];
		const stat = stats[property];

		ctx.beginPath();
		ctx.moveTo(
			canvas.width / 2 + hexMaxRadius * Math.sin(hexSpace * i),
			canvas.height / 2 + hexMaxRadius * Math.cos(hexSpace * i)
		);

		ctx.lineTo(canvas.width / 2, canvas.width / 2);
		ctx.stroke();

		ctx.fillText(
			standStats[stat],
			canvas.width / 2 + (hexMaxRadius + 20) * Math.sin(hexSpace * i),
			canvas.height / 2 + (hexMaxRadius + 20) * Math.cos(hexSpace * i)
		);

		for (let j = 0; j < 5; j++) {
			const chartHeight = (hexMaxRadius / 6) * (j + 1);
			const dashHalf = 0.15 / (j + 1);

			ctx.beginPath();
			ctx.moveTo(
				canvas.width / 2 + chartHeight * Math.sin(hexSpace * i - dashHalf),
				canvas.height / 2 + chartHeight * Math.cos(hexSpace * i - dashHalf)
			);

			ctx.lineTo(
				canvas.width / 2 + chartHeight * Math.sin(hexSpace * i + dashHalf),
				canvas.height / 2 + chartHeight * Math.cos(hexSpace * i + dashHalf)
			);

			ctx.stroke();
		}
	}

	ctx.font = "10px Arial";
	for (let i = 0; i < 5; i++) {
		ctx.fillText(
			standStats[i],
			canvas.width / 2 + 10,
			canvas.height / 2 - (hexMaxRadius / 6) * (i + 1)
		);
	}
}

const chartForm = document.getElementById("chart-form");
const chartUrlInput = document.getElementById("chart-url");
const standRevealSection = document.getElementById("stand-reveal");
const standName = document.getElementById("stand-name");
const standStatsPower = document.getElementById("stand-stats-power");
const standStatsSpeed = document.getElementById("stand-stats-speed");
const standStatsRange = document.getElementById("stand-stats-range");
const standStatsDurability = document.getElementById("stand-stats-durability");
const standStatsPrecision = document.getElementById("stand-stats-precision");
const standStatsPotential = document.getElementById("stand-stats-potential");
const standChart = document.getElementById("stand-chart-canvas");

chartForm.addEventListener("submit", (event) => {
	event.preventDefault();

	const chartUrl = chartUrlInput.value;
	const rawStats = readStats(chartUrl);
	const stats = convertStats(rawStats);
	const stand = getStand(stats);

	standName.textContent = "Your stand is " + stand.name;
	standStatsPower.textContent = standStats[stand.power];
	standStatsSpeed.textContent = standStats[stand.speed];
	standStatsRange.textContent = standStats[stand.range];
	standStatsDurability.textContent = standStats[stand.durability];
	standStatsPrecision.textContent = standStats[stand.precision];
	standStatsPotential.textContent = standStats[stand.potential];
	standRevealSection.hidden = false;

	console.log(stand);

	drawChart(standChart, stand);
});
