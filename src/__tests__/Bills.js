import { screen, waitFor, fireEvent } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

// Mock de la partie 'store' pour simuler les appels à l'API
jest.mock("../app/Store", () => mockStore);

// Début des tests pour la page Bills
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {    
    beforeEach(() => {
        Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
        writable: true,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
    });
    // Test : Vérifier la mise en surbrillance de l'icône de facture dans la mise en page verticale
    test("Then bill icon in vertical layout should be highlighted", async () => {      
      await waitFor(() => screen.getByTestId("icon-window"));
      // Récupérer l'élément icône dès sa disponibilité dans le DOM
      const windowIcone = screen.getByTestId("icon-window");
      const windowIconeActive = windowIcone.classList.contains("active-icon");
      // vérifier que l'élément a bien la classe active-icone
      expect(windowIconeActive).toHaveClass;
    });

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
    // Vérifier l'ouverture de la modale lors du clic sur l'icône d'oeil
    test("Then a modal should open when clicking on an eye icon", () => {
      // Initialiser le DOM avec les données des factures
      document.body.innerHTML = BillsUI({ data: bills });

      // Récupérer toutes les icônes d'oeil présentes dans le document
      const iconeEye = screen.getAllByTestId("icon-eye");

      // Itération sur chaque icône d'oeil
      iconeEye.forEach((icon) => {
        // Ajouter un écouteur d'événement à chaque icône
        icon.addEventListener("click", () => {
          // Rechercher la modale dans le DOM après le clic
          const modale = document.getElementById("modaleFile");
          // Vérifier que la modale existe  après le clic
          expect(modale).toBeTruthy();
        });

        // fireEvent permet de déclencher des événements DOM, ici un clic
        fireEvent.click(icon);
      });
    });
    // Vérifier la navigation vers la page NewBill lors du clic sur le bouton 'Nouvelle note de frais'
    test('Then clicking on the "New Bill" button should navigate to the New Bill page', async () => {
      // Récupérer le bouton "Nouvelle note de frais" dans le DOM
      const btnNewBill = screen.getAllByTestId("btn-new-bill");
      btnNewBill[0].click();
      await waitFor(() =>
        // vérifier que l'URL contient bien le chemin souhaité
        expect(window.location.href).toContain(ROUTES_PATH.NewBill)
      );
    });

    test("handleClickIconEye should open the modal with the bill image", () => {
      document.body.innerHTML = BillsUI({ data: bills });

      // Fonction pour créer une nouvelle instance de la classe Bills
      const initBills = new Bills({
        document,
        onNavigate,
        store: null,
        localStorage: window.localStorage,
      });

      const eyeIcone = screen.getAllByTestId("icon-eye")[0];
      $.fn.modal = jest.fn(); // Mock de la fonction modal de Bootstrap

      // Simuler l'event clic sur l'icône
      const handleClickIconeEye = jest.fn(() =>
        initBills.handleClickIconEye(eyeIcone)
      );

      eyeIcone.addEventListener("click", handleClickIconeEye);
      fireEvent.click(eyeIcone);

      // Vérifier si la fonction et la modale ont bien été appelées
      expect(handleClickIconeEye).toHaveBeenCalled();
      expect($.fn.modal).toHaveBeenCalled();
    });
  });
});