const fs = require("fs");
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

function run(cmd, lang) {
	execSync(cmd, {
		stdio: "inherit",
		cwd: root,
		env: { ...process.env, RESUME_LANG: lang },
	});
}

for (const variant of VARIANTS)
	for (const lang of LANGS) {
		const resume = mergeResume(
			readJson(`base.${lang}.json`),
			readJson(`${variant}.${lang}.json`),
		);
		fs.writeFileSync(
			path.join(root, "resume.json"),
			JSON.stringify(resume, null, "\t") + "\n",
		);
		run(
			`npm run validate && resume export kamil_kacperek_${variant}_${lang}.pdf --theme ./themes/kendall`,
			lang,
		);
	}
