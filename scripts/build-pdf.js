const fs = require("fs");
const os = require("os");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const contentDir = path.join(root, "content");

const VARIANTS = ["tech", "visual"];
const LANGS = ["en", "pl"];

function readJson(fileName) {
	return JSON.parse(fs.readFileSync(path.join(contentDir, fileName), "utf8"));
}

function mergeResume(base, variant) {
	return {
		...base,
		basics: { ...base.basics, ...variant.basics },
		work: [...variant.work, ...base.work],
		skills: variant.skills,
	};
}

function pdfPath(variant, lang) {
	return path.join(root, `kamil_kacperek_${variant}_${lang}.pdf`);
}

function assertReplaceable(filePath) {
	if (!fs.existsSync(filePath)) return;

	let fd;
	try {
		fd = fs.openSync(filePath, "r+");
	} catch (error) {
		if (error.code === "EBUSY" || error.code === "EPERM")
			throw new Error(
				`Cannot overwrite ${filePath}. Close it in the PDF viewer and run the build again.`,
			);

		throw error;
	}

	fs.closeSync(fd);
}

function replacePdf(tmpPath, destPath) {
	if (!fs.existsSync(destPath)) {
		fs.renameSync(tmpPath, destPath);
		return;
	}

	const backupPath = `${destPath}.${process.pid}.bak`;
	try {
		fs.renameSync(destPath, backupPath);
	} catch (error) {
		fs.rmSync(tmpPath, { force: true });
		if (error.code === "EBUSY" || error.code === "EPERM")
			throw new Error(
				`Cannot overwrite ${destPath}. Close it in the PDF viewer and run the build again.`,
			);

		throw error;
	}

	try {
		fs.renameSync(tmpPath, destPath);
	} catch (error) {
		fs.renameSync(backupPath, destPath);
		throw error;
	}

	fs.rmSync(backupPath, { force: true });
}

function run(cmd, lang) {
	execSync(cmd, {
		stdio: "inherit",
		cwd: root,
		env: { ...process.env, RESUME_LANG: lang },
	});
}

for (const variant of VARIANTS)
	for (const lang of LANGS) assertReplaceable(pdfPath(variant, lang));

for (const variant of VARIANTS)
	for (const lang of LANGS) {
		const resume = mergeResume(
			readJson(`base.${lang}.json`),
			readJson(`${variant}.${lang}.json`),
		);
		const destPath = pdfPath(variant, lang);
		const tmpPath = path.join(
			os.tmpdir(),
			`kamil_kacperek_${variant}_${lang}.${process.pid}.pdf`,
		);

		fs.writeFileSync(
			path.join(root, "resume.json"),
			JSON.stringify(resume, null, "\t") + "\n",
		);
		run(
			`npm run validate && resume export "${tmpPath}" --theme ./themes/kendall`,
			lang,
		);
		replacePdf(tmpPath, destPath);
		console.log(`Wrote ${destPath}`);
	}
