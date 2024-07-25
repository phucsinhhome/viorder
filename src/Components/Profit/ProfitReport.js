import { useState, useEffect } from "react";
import { getProfitReportThisMonth } from "../../db/profit";
import { Link } from "react-router-dom";
import { toVND } from "../../Service/Utils";

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
    // {
    //   name: "Last Month",
    //   adjustedMonths: -1,
    //   entiredMonth: true
    // },
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
    // {
    //   name: "Next Month",
    //   adjustedMonths: 1,
    //   entiredMonth: true
    // }
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
    var classNamePattern = "font-bold text-sm text-amber-800 rounded px-2 py-0.5"
    return classNamePattern + " " + (currentKey === reportKey ? "bg-slate-400" : "bg-slate-200");
  }

  return (
    <>
      <div class="bg-slate-50 px-2">
        <div class="flex flex-wrap py-2 px-2 space-x-4 pl-4">
          <div className="flex flex-row items-center mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-amber-700 dark:text-white"
            >
              <path fill-rule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clip-rule="evenodd" />
            </svg>
            <Link
              onClick={() => fetchReport()}
              className="font-bold text-amber-800"
            >
              Update
            </Link>
          </div>
        </div>
        <div className="flex flex-row space-x-2 pl-4 mb-2">
          {reports.map((rp) => {
            return (<Link
              key={rp.key}
              onClick={() => setReportType(rp)}
              relative="route"
              className={filterClass(rp.key, reportType.key)}>{rp.name}
            </Link>)
          })}
        </div>

        <div class="flex flex-wrap py-2 space-x-4">
          <div className="space-x-2 pl-4">
            {timeFilters.map((per) => {
              return (<Link key={per.name} onClick={() => calculatePeriod(per)} relative="route" className={filterClass(per.name, period.name)}>{per.name}</Link>)
            })}
          </div>
        </div>

        <div className="flex flex-col w-full  rounded-lg border border-spacing-1 px-2 py-2 mb-6 mx-1 shadow-sm">
          <div className="flex flex-row space-x-2 ">
            <div className="flex flex-col w-1/2 rounded-lg border border-spacing-1 px-2 py-2 shadow-lg">
              <div>
                <span className="font font-bold text-gray-500">Expenditure</span>
              </div>
              <div>
                <span>{toVND(report.overall.expense)}</span>
              </div>
            </div>
            <div className="flex flex-col w-1/2 rounded-lg border border-spacing-1 px-2 py-2 shadow-lg">
              <div>
                <span className="font font-bold text-gray-500">Revenue</span>
              </div>
              <div>
                <span>{toVND(report.overall.revenue)}</span>
              </div>
            </div>
          </div>
          <div className="w-full py-1 flex flex-row justify-items-center pt-3">
            <span className="w-1/2 text-right font font-bold text-gray-500 pr-1">Profit:</span>
            <span className="w-1/2 text-left pl-1">{toVND(report.overall.profit)}</span>
          </div>
        </div>

        {/* <div>
          <Table hoverable>
            <Table.Head className="my-1">
              <Table.HeadCell className="sm:px-1 py-2">

              </Table.HeadCell>
              <Table.HeadCell className="sm:px-1 py-2">
                Amount
              </Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y" >
              {invoice.items.map((exp) => {
                return (
                  <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800 text-sm my-1 py-1" key={exp.id}>
                    <Table.Cell className="sm:px-1 py-1">
                      <div className="grid grid-cols-1 py-0 my-0">
                        <div
                          className="font text-sm text-blue-600 hover:underline dark:text-blue-500"
                          onClick={() => editItem(exp)}
                        >
                          {exp.itemName}
                        </div>
                        <div className="flex flex-row text-[10px] space-x-1">
                          <span className="w-6">{"x" + exp.quantity}</span>
                          <span className="w-24">{exp.amount.toLocaleString('us-US', { style: 'currency', currency: 'VND' })}</span>
                          <span className="font font-mono font-black">{exp.service}</span>
                        </div>
                      </div>
                    </Table.Cell>
                    <Table.Cell className="py-1">
                      <svg className="w-6 h-6 text-red-800 dark:text-white"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        fill="none"
                        viewBox="0 0 24 24"
                        onClick={() => askForDelItemConfirmation(exp)}
                      >
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z" />
                      </svg>

                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        </div> */}

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
    </>
  )
}
