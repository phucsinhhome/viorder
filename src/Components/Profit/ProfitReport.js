import { useState, useEffect } from "react";
import UpdateButton from "../Button/Button";
import { getProfitReportThisMonth } from "../../db/profit";

const reports = [
  {
    name: "By Service",
    key: "services"
  },
  {
    name: "By Editor",
    key: "editors"
  },
  {
    name: "By Investor",
    key: "investors"
  }
]

export function ProfitReport() {
  const [report, setReport] = useState({
    "fromDate": "2023-12-01",
    "toDate": "2023-12-13",
    "id": null,
    "overall": {
      "expense": 11879991,
      "revenue": 7797616,
      "name": "OVERALL",
      "displayName": "Tổng Quan",
      "profit": -4082375
    },
    "breakdown": [
      {
        "expense": 1330000,
        "revenue": 0,
        "name": "INVEST",
        "displayName": "Đầu Tư",
        "profit": -1330000
      }
    ]
  })

  const beginOfMonth = () => {
    var today = new Date()
    today.setDate(2)
    today.setHours(0)
    today.setMinutes(0)
    today.setSeconds(0)

    return today
  }

  const endOfToday = () => {
    var today = new Date()
    today.setHours(23)
    today.setMinutes(59)
    today.setSeconds(59)

    return today
  }

  const [reportType, setReportType] = useState(reports[0])
  const [period, setPeriod] = useState({ fromDate: beginOfMonth(), toDate: endOfToday() })

  useEffect(() => {

    var fD = period.fromDate.toISOString().split('T')[0]
    var tD = period.toDate.toISOString().split('T')[0]

    getProfitReportThisMonth(fD, tD, reportType.key)
      .then(data => setReport(data))
  }, [period, reportType.key]);



  return (
    <div class="bg-slate-50">
      <div class="py-2 px-2">
        <UpdateButton title="Update" disable={false} onClick={() => {
          getProfitReportThisMonth().then(data => setReport(data))
        }} />
      </div>

      <table class="table-auto border-separate text-xl border-spacing-0 font-sans px-2 w-11/12" >
        <thead class="bg-slate-200">
          <tr class="text-xl font-semibold">
            <th class="" />
            <th class="px-2 pl-4 text-right text-green-900">Revenue</th>
            <th class="px-2 text-center text-green-900">Expense</th>
            <th class="px-2 text-center text-green-900">Profit</th>
          </tr>
        </thead>
        <tbody>
          <td class="font-bold italic text-sm">GENERAL</td><td /><td />
          <tr class="text-sm">
            <td class="text-center ">{report.overall.displayName}</td>
            <td class="px-2 text-right font-mono ">{report.overall.revenue.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}</td>
            <td class="px-2 text-right font-mono">{report.overall.expense.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}</td>
            <td class="px-2 text-right font-mono">{report.overall.profit.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}</td>
          </tr>

          <td class="font-bold italic text-sm">SERVICES</td><td /><td />
          {report.breakdown.map((item) => {
            return (
              <tr class="text-sm">
                <td class="text-center">{item.displayName}</td>
                <td class="px-2 text-right font-mono">{item.revenue.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}</td>
                <td class="px-2 text-right font-mono">{item.expense.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}</td>
                <td class="px-2 text-right font-mono">{item.profit.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}</td>
              </tr>
            )
          })}

          {/* <td class="font-bold italic text-sm">MEMBERS</td><td /><td />
          {report.peoples.map((peop) => {
            return (
              <tr class="text-sm">
                <td class="text-center">{peop.displayName}</td>
                <td class="px-2 text-right font-mono">{peop.incomeAmount.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}</td>
                <td class="px-2 text-right font-mono">{peop.expenseAmount.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}</td>
                <td class="px-2 text-right font-mono">{peop.profitAmount.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}</td>
              </tr>
            )
          })} */}
        </tbody>
      </table>
    </div >
  );
}
