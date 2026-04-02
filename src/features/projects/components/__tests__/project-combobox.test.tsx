import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectCombobox } from "../project-combobox";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = () => {};
});

const mockProjects = [
  { id: "1", name: "Warsztaty React" },
  { id: "2", name: "Szkolenie TypeScript" },
  { id: "3", name: "Konsulting DevOps" },
];

describe("ProjectCombobox", () => {
  it("should render with placeholder when no value", () => {
    render(
      <ProjectCombobox value="" onChange={() => {}} projects={mockProjects} />,
    );

    expect(
      screen.getByText("Wybierz lub dodaj projekt..."),
    ).toBeInTheDocument();
  });

  it("should render with the selected value", () => {
    render(
      <ProjectCombobox
        value="Warsztaty React"
        onChange={() => {}}
        projects={mockProjects}
      />,
    );

    expect(screen.getByText("Warsztaty React")).toBeInTheDocument();
  });

  it("should open dropdown and show projects on click", async () => {
    const user = userEvent.setup();

    render(
      <ProjectCombobox value="" onChange={() => {}} projects={mockProjects} />,
    );

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByText("Warsztaty React")).toBeInTheDocument();
    expect(screen.getByText("Szkolenie TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Konsulting DevOps")).toBeInTheDocument();
  });

  it("should filter projects by search input", async () => {
    const user = userEvent.setup();

    render(
      <ProjectCombobox value="" onChange={() => {}} projects={mockProjects} />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.type(screen.getByPlaceholderText("Szukaj projektu..."), "React");

    expect(screen.getByText("Warsztaty React")).toBeInTheDocument();
    expect(screen.queryByText("Szkolenie TypeScript")).not.toBeInTheDocument();
    expect(screen.queryByText("Konsulting DevOps")).not.toBeInTheDocument();
  });

  it('should show "Dodaj:" option for new project name', async () => {
    const user = userEvent.setup();

    render(
      <ProjectCombobox value="" onChange={() => {}} projects={mockProjects} />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.type(
      screen.getByPlaceholderText("Szukaj projektu..."),
      "Nowy Projekt",
    );

    expect(screen.getByText("Nowy Projekt")).toBeInTheDocument();
    expect(screen.getByText("Dodaj:")).toBeInTheDocument();
  });

  it('should not show "Dodaj:" when input matches existing project', async () => {
    const user = userEvent.setup();

    render(
      <ProjectCombobox value="" onChange={() => {}} projects={mockProjects} />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.type(
      screen.getByPlaceholderText("Szukaj projektu..."),
      "Warsztaty React",
    );

    expect(screen.queryByText("Dodaj:")).not.toBeInTheDocument();
  });
});
