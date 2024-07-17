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
const DEFAULT_PAGE_SIZE = process.env.REACT_APP_DEFAULT_PAGE_SIZE

export const currentUser = tele.initDataUnsafe.user || {
  id: "1351151927",
  first_name: "Minh",
  last_name: "Tran"
}

export default function App() {

  useEffect(() => {
    tele.ready();
    tele.expand();
  }, []);


  return (
    <div className="flex flex-col relative h-[100dvh] min-h-0 bg-slate-50">
      <Router>
        <div className="mt-2 mx-2 w-full flex flex-row  space-x-2">
          <Link to="profit" className="px-3 py-0.5 bg-gray-200 text-amber-900 text-sm font-sans rounded-sm">Profit</Link>
          <Link to="invoice" className="px-3 py-0.5 bg-gray-200 text-amber-900 text-sm font-sans rounded-sm">Invoice</Link>
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
      <div className="absolute top-0 right-0 flex flex-col mt-10">
        <span className=" font text-sm italic text-gray-800 dark:text-white">{currentUser.first_name + " " + currentUser.last_name}</span>
        <span className=" font text-sm italic text-gray-900 dark:text-white">{currentUser.id}</span>
      </div>
    </div>
  );
}
