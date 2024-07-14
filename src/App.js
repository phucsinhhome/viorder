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
    id:"1351151927",
    first_name: "Minh",
    last_name: "Tran"
}

export default function App() {

  useEffect(() => {
    tele.ready();
  }, []);


  return (
    <div>
      <Router>
        <div className="my-2 mx-2">
          <Link to="profit" className="px-3 py-2 bg-gray-200 text-amber-900 text-sm font-sans ">Profit</Link>
          <Link to="invoice" className="px-3 py-2 bg-gray-200 text-amber-900 text-sm font-sans ">Invoice</Link>
          <Link to="expenses" state={{ pageNumber: 0, pageSize: DEFAULT_PAGE_SIZE }} className="px-3 py-2 bg-gray-200 text-amber-900 text-sm font-sans ">Expense</Link>
          <Link to="reservation" className="px-3 py-2 bg-gray-200 text-amber-900 text-sm font-sans ">Reservation</Link>
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
      <div className="w-full">
        <span className="w-full font text-sm line">{currentUser.first_name + " " + currentUser.last_name + " - Id: " + currentUser.id}</span>
      </div>
    </div>
  );
}
