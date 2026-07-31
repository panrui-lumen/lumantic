/** @type {import("jest").Config} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/src"],
	testMatch: ["**/__tests__/**/*.test.ts"],
	moduleFileExtensions: ["ts", "js", "json"],
	clearMocks: true,
	collectCoverageFrom: ["src/shared/**/*.ts", "!src/shared/**/*.d.ts"],
	transform: {
		"^.+\\.tsx?$": [
			"ts-jest",
			{
				tsconfig: "<rootDir>/tsconfig.jest.json",
			},
		],
	},
};
