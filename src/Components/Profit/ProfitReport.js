import { useState, useEffect } from "react";
import { getProfitReportThisMonth } from "../../db/profit";
import { Link } from "react-router-dom";

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
const lastDateOf = (date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

const beginOfDay = (date) => {
  date.setHours(0)
  date.setMinutes(0)
  date.setSeconds(0)
  return date
}

const endOfDay = (date) => {
  date.setHours(23)
  date.setMinutes(59)
  date.setSeconds(59)
  return date
}

const adjustMonths = (date, numOfMonths) => {
  return new Date(date.setMonth(date.getMonth() + numOfMonths))
}

const beginOfMonth = (date) => {
  date.setDate(1)
  beginOfDay(date)
  return date
}

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

  const [reportType, setReportType] = useState(reports[0])
  const [period, setPeriod] = useState(
    {
      name: "Today",
      range: {
        fromDate: beginOfMonth(new Date()),
        toDate: endOfDay(new Date())
      }
    })

  const timeFilters = [
    {
      name: "Last Month",
      adjustedMonths: -1,
      entiredMonth: true
    },
    {
      name: "Today",
      adjustedMonths: 0,
      entiredMonth: false
    },
    {
      name: "End of Month",
      adjustedMonths: 0,
      entiredMonth: true
    },
    {
      name: "Next Month",
      adjustedMonths: 1,
      entiredMonth: true
    }
  ]

  const calculatePeriod = (timeFilter) => {

    var nextFromDate = timeFilter.adjustedMonths === 0 ? beginOfDay(beginOfMonth(new Date())) : beginOfDay(adjustMonths(period.range.fromDate, timeFilter.adjustedMonths))
    var nextToDate = endOfDay(new Date(nextFromDate))
    var dayOfMonth = timeFilter.entiredMonth ? lastDateOf(nextToDate) : new Date().getDate()
    console.info("Setting day of [%s] is [%d]", nextToDate, dayOfMonth)
    nextToDate.setDate(dayOfMonth)

    var newPeriod = {
      name: timeFilter.name,
      range: {
        fromDate: nextFromDate,
        toDate: nextToDate
      }
    }
    setPeriod(newPeriod)
  }


  const fetchReport = () => {
    var fD = period.range.fromDate.toISOString().split('T')[0]
    var tD = period.range.toDate.toISOString().split('T')[0]

    getProfitReportThisMonth(fD, tD, reportType.key)
      .then(data => setReport(data))
  }

  useEffect(() => {
    var fD = period.range.fromDate.toISOString().split('T')[0]
    var tD = period.range.toDate.toISOString().split('T')[0]

    getProfitReportThisMonth(fD, tD, reportType.key)
      .then(data => setReport(data))
  }, [reportType, period]);

  const filterClass = (reportKey, currentKey) => {
    var classNamePattern = "font-bold text-amber-800 rounded px-2 py-1"
    return classNamePattern + " " + (currentKey === reportKey ? "bg-slate-400" : "bg-slate-200");
  }

  return (
    <div class="bg-slate-50">
      <div class="flex flex-wrap py-2 px-2 space-x-4 ">
        <Link onClick={() => fetchReport()} className="font-bold text-amber-800">Update</Link>
        <div className="space-x-2">
          {reports.map((rp) => {
            return (<Link key={rp.key} onClick={() => setReportType(rp)} relative="route" className={filterClass(rp.key, reportType.key)}>{rp.name}</Link>)
          })}
        </div>
      </div>
      <div class="flex flex-wrap py-2 px-2 space-x-4 ">
        <div className="space-x-2">
          {timeFilters.map((per) => {
            return (<Link key={per.name} onClick={() => calculatePeriod(per)} relative="route" className={filterClass(per.name, period.name)}>{per.name}</Link>)
          })}
        </div>
      </div>

      <table class="table-auto border-separate border-spacing-0 font-sans px-2 w-11/12" >
        <thead class="bg-slate-200">
          <tr class="">
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

          <td class="font-bold italic text-sm">{String(reportType.name).toUpperCase()}</td><td /><td />
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
        </tbody>
      </table>
    </div >
  );
}
