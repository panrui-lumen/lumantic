import { canAccessSettings, isWorkspaceRole } from "../access";

describe("canAccessSettings", () => {
	it("allows Owner and Admin", () => {
		expect(canAccessSettings("Owner")).toBe(true);
		expect(canAccessSettings("Admin")).toBe(true);
	});

	it("denies Member and unknown roles", () => {
		expect(canAccessSettings("Member")).toBe(false);
		expect(canAccessSettings("Head of Data")).toBe(false);
		expect(canAccessSettings("")).toBe(false);
		expect(canAccessSettings(null)).toBe(false);
		expect(canAccessSettings(undefined)).toBe(false);
	});
});

describe("isWorkspaceRole", () => {
	it("accepts Owner, Admin, and Member", () => {
		expect(isWorkspaceRole("Owner")).toBe(true);
		expect(isWorkspaceRole("Admin")).toBe(true);
		expect(isWorkspaceRole("Member")).toBe(true);
	});

	it("rejects other strings", () => {
		expect(isWorkspaceRole("owner")).toBe(false);
		expect(isWorkspaceRole("Viewer")).toBe(false);
		expect(isWorkspaceRole("")).toBe(false);
	});
});
