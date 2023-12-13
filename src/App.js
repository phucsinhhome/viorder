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

function App() {

  useEffect(() => {
    tele.ready();
  }, []);


  return (
    <Router>
      <div className="my-2 mx-2">
        <Link to="profit" className="px-3 py-2 bg-gray-200 text-amber-900 text-sm font-sans ">Profit</Link>
        <Link to="invoice" className="px-3 py-2 bg-gray-200 text-amber-900 text-sm font-sans ">Invoice</Link>
        <Link to="expenses" state={{ pageNumber: 0, pageSize: 10 }} className="px-3 py-2 bg-gray-200 text-amber-900 text-sm font-sans ">Expense</Link>
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
  );
}

export default App
