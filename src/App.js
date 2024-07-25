import { useEffect } from "react";
import "./App.css";
import { ProfitReport } from "./Components/Profit/ProfitReport"
import { InvoiceManager } from "./Components/Invoice/InvoiceManager"
import { EditInvoice } from "./Components/Invoice/EditInvoice"
import { BrowserRouter as Router, Link, Route, Routes } from "react-router-dom"
import { ExpenseManager } from "./Components/Expense/ExpenseManager";
import { EditExpense } from "./Components/Expense/EditExpense";
import { ReservationManager } from "./Components/Reservation/ReservationManager";
import { EditReservation } from "./Components/Reservation/EditReservation";

const tele = window.Telegram.WebApp;
export const DEFAULT_PAGE_SIZE = process.env.REACT_APP_DEFAULT_PAGE_SIZE

export const currentUser = tele.initDataUnsafe.user || {
  id: "1351151927",
  first_name: "Minh",
  last_name: "Tran"
}

export const currentUserFullname = () => {
  let sufix = currentUser.last_name === null || currentUser.last_name === undefined || currentUser.last_name === "" ? "" : (" " + currentUser.last_name)
  return currentUser.first_name + sufix
}

export default function App() {

  useEffect(() => {
    // const script = document.createElement('script');
    // script.setAttribute('src', 'https://phucsinhhcm.hopto.org:9000/openresources/lib/telegram-web-app.js');
    // script.async = true
    // script.integrity = "sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p"
    // script.crossOrigin = "anonymous"
    // document.appendChild(script);

    document.title = "PMS"
    tele.ready();
    tele.expand();
    tele.disableVerticalSwipes();
    console.info("TELEGRAM BOT API VERSION: %s", tele.version)

    // return () => {
    //   // clean up the script when the component in unmounted
    //   document.body.removeChild(script)
    // }
  }, []);


  return (
    <div className="flex flex-col relative h-[100dvh] min-h-0 bg-slate-50">
      <Router>
        <div className="mt-2 mx-2 w-full flex flex-row  space-x-2">
          <Link to="profit" className="px-3 py-0.5 bg-gray-200 text-amber-900 text-sm font-sans rounded-sm">Profit</Link>
          <Link to="invoice" className="px-3 py-0.5 bg-gray-200 text-amber-900 text-sm font-sans rounded-sm" state={{ pageNumber: 0, pageSize: DEFAULT_PAGE_SIZE }}>Invoice</Link>
          <Link to="expenses" className="px-3 py-0.5 bg-gray-200 text-amber-900 text-sm font-sans rounded-sm" state={{ pageNumber: 0, pageSize: DEFAULT_PAGE_SIZE }}>Expense</Link>
          <Link to="reservation" className="px-3 py-0.5 bg-gray-200 text-amber-900 text-sm font-sans rounded-sm">Reservation</Link>
        </div>
        <Routes>
          <Route path="profit" element={<ProfitReport />} />
          <Route path="invoice" element={<InvoiceManager />} />
          <Route path="invoice/:invoiceId" element={<EditInvoice />} />
          <Route path="expenses" element={<ExpenseManager />} />
          <Route path="expenses/:expenseId" element={<EditExpense />} />
          <Route path="reservation" element={<ReservationManager />} />
          <Route path="reservation/:reservationId" element={<EditReservation />} />
        </Routes>
      </Router>
      <div className="absolute top-0 right-0 flex flex-col mt-3 bg-neutral-200 p-1 opacity-90 rounded-sm shadow-lg">
        <span className=" font text-[10px] font-bold italic text-gray-800 dark:text-white">{currentUserFullname()}</span>
        <span className=" font text-[8px] italic text-gray-900 dark:text-white">{currentUser.id}</span>
        <span className=" font font-mono text-center text-[8px] text-gray-900 dark:text-white">{tele.version}</span>
      </div>
    </div>
  );
}
