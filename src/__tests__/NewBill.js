// Importer les dépendances nécessaires
import { jest } from "@jest/globals";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage";
import mockStore from "../__mocks__/store";
import NewBill from "../containers/NewBill.js";
import NewBillUI from "../views/NewBillUI.js";

// Mock du store de l'application
jest.mock("../app/Store", () => mockStore);

// Créer NewBill
const createNewBill = () => {
  const onNavigate = (pathname) => (document.body.innerHTML = pathname);
  return initNewBill(onNavigate);
};

const initNewBill = (onNavigate = jest.fn()) => {
  return new NewBill({
    document,
    onNavigate,
    store: mockStore,
    localStorage: window.localStorage,
  });
};

// Tester le comportement de la page NewBill
describe("Given I am connected as an employee", () => {
  // Simulation de connection en tant qu'employé
  beforeEach(() => {
    document.body.innerHTML = NewBillUI();
    Object.defineProperty(window, "localStorage", { value: localStorageMock });
    window.localStorage.setItem(
      "user",
      JSON.stringify({
        type: "Employee",
        email: "employee@test.tld",
        status: "connected",
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Tester l'affichage du formulaire de la page NewBill
  describe("When I am on NewBill Page", () => {
    test("Then the new bill form should be rendered", () => {
      // Vérifier la présence du formulaire dans le DOM
      const form = screen.getByTestId("form-new-bill");
      expect(form).toBeTruthy();
    });
  });

  // Tester la soumission du formulaire de NewBill avec des données valides 
  describe("When I submit the form with valid inputs", () => {
    test("Then it should create a new bill and redirect to Bills page", () => {
      // Initialiser l'interface utilisateur et l'instance NewBill
      createNewBill();

      // Espionner la fonction update du store mocké
      jest.spyOn(mockStore.bills(), "update");

      // Récupèrer les éléments saisis du formulaire
      const form = screen.getByTestId("form-new-bill");
      const expenseType = screen.getByTestId("expense-type");
      const expenseName = screen.getByTestId("expense-name");
      const datepicker = screen.getByTestId("datepicker");
      const amount = screen.getByTestId("amount");
      const pct = screen.getByTestId("pct");
      const file = screen.getByTestId("file");

      // Simule la saisie des données dans le formulaire
      fireEvent.change(expenseType, {
        target: { value: "Fournitures de bureau" },
      });
      fireEvent.change(expenseName, {
        target: { value: "Matériel informatique" },
      });
      fireEvent.change(datepicker, { target: { value: "2023-04-16" } });
      fireEvent.change(amount, { target: { value: "100" } });
      fireEvent.change(pct, { target: { value: "20" } });
      fireEvent.change(file, {
        target: {
          files: [new File(["file"], "file.png", { type: "image/png" })],
        },
      });

      // Simuler une réponse réussie de l'API
      jest.spyOn(mockStore.bills(), "update").mockResolvedValue({});

      // Soumettre le formulaire saisi
      fireEvent.submit(form);

      // Vérifier que la fonction update a bien été appelée
      expect(mockStore.bills().update).toHaveBeenCalled();
    });
  });

  describe("When API returns an error", () => {
    let newBill;
    let form;

    beforeEach(() => {
      document.body.innerHTML = NewBillUI();
      newBill = createNewBill();
      form = screen.getByTestId("form-new-bill");
      // Remplir le formulaire avec des données valides si cela est nécessaire
      jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      console.error.mockRestore();
    });

    test("Then it should log the 404 error and still navigate", async () => {
      // Simuler une erreur 404
      jest
        .spyOn(mockStore.bills(), "update")
        .mockRejectedValue(new Error("404"));

      // Soumettre le formulaire
      fireEvent.submit(form);

      // Attendre que l'erreur soit traitée
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(new Error("404"));
        expect(document.body.innerHTML).toBe("#employee/bills");
      });
    });

    test("Then it should log the 500 error and still navigate", async () => {
      // Simuler une erreur 500
      jest
        .spyOn(mockStore.bills(), "update")
        .mockRejectedValue(new Error("500"));

      // Soumettre le formulaire
      fireEvent.submit(form);

      // Attendre que l'erreur soit traitée
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(new Error("500"));
        expect(document.body.innerHTML).toBe("#employee/bills");
      });
    });
  });

  // Tests du téléchargement de fichiers
  describe("When I upload a file", () => {
    let newBill;
    let fileInput;

    beforeEach(() => {
      // Initialiser l'interface utilisateur et l'instance NewBill pour chaque test
      document.body.innerHTML = NewBillUI();
      newBill = initNewBill();
      fileInput = screen.getByTestId("file");
    });

    // vérifier qu'un fichier qui esu au bon format soit accepté
    test("Then input a file with correct format should keep the file and then call create method", async () => {
      const handleChangeFile = jest.fn((e) => newBill.handleChangeFile(e));
      fileInput.addEventListener("change", handleChangeFile);

      // Simuler le téléchargement d'un fichier valide
      const FileTest = new File(["test"], "test.jpg", { type: "image/jpg" });
      fireEvent.change(fileInput, { target: { files: [FileTest] } });

      // Vérifier que la fonction handleChangeFile a  bien été appelée et que le fichier est correct
      expect(handleChangeFile).toHaveBeenCalled();
      expect(fileInput.files[0].name).toBe("test.jpg");
    });

    // vérifier qu'un fichier qui n'est pas au bon  format soit rejeté
    test("Then an alert should be showen if the file format is invalid", async () => {
      // Mocke la fonction alert du navigateur
      window.alert = jest.fn();

      // Simuler le téléchargement d'un fichier invalide
      const file = new File(["document"], "document.pdf", {
        type: "application/pdf",
      });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Vérifier que l'alerte a bien été affichée avec le bon message
      await waitFor(() =>
        expect(window.alert).toHaveBeenCalledWith(
          "Seuls les formats suivants : 'jpg, jpeg et png' sont autorisés pour les fichiers du justificatif"
        )
      );
    });
  });
});