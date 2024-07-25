import { useState, useEffect } from "react";
import { getProfitReportThisMonth } from "../../db/profit";
import { Link } from "react-router-dom";
import { adjustMonths, beginOfMonth, lastDateOf as lastDayOfMonth, toVND, simpleDateToISODate } from "../../Service/Utils";

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

  const [reportType, setReportType] = useState(reports[0])
  const [period, setPeriod] = useState(
    {
      name: "Today",
      range: {
        fromDate: simpleDateToISODate(beginOfMonth(new Date())),
        toDate: simpleDateToISODate(new Date())
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

    var nextFromDate = timeFilter.adjustedMonths === 0 ? beginOfMonth(new Date()) : adjustMonths(new Date(period.range.fromDate), timeFilter.adjustedMonths)
    var nextToDate = new Date(nextFromDate)
    var numOfDay = timeFilter.entiredMonth ? lastDayOfMonth(nextToDate) : new Date().getDate()
    nextToDate.setDate(numOfDay)

    let nFD = simpleDateToISODate(nextFromDate)
    let nTD = simpleDateToISODate(nextToDate)

    console.info("Setting report period from [%s] to [%s] with days of month [%d]", nFD, nTD, numOfDay)
    var newPeriod = {
      name: timeFilter.name,
      range: {
        fromDate: nFD,
        toDate: nTD
      }
    }
    setPeriod(newPeriod)
  }


  const fetchReport = () => {
    var fD = period.range.fromDate
    var tD = period.range.toDate
    console.info("Loading profit report by %s from %s to %s", reportType.key, fD, tD)

    getProfitReportThisMonth(fD, tD, reportType.key)
      .then(data => setReport(data))
  }

  useEffect(() => {
    fetchReport()
  }, [reportType, period]);

  const filterClass = (reportKey, currentKey) => {
    var classNamePattern = "font-bold text-sm text-amber-800 rounded px-2 py-0.5"
    return classNamePattern + " " + (currentKey === reportKey ? "bg-slate-400" : "bg-slate-200");
  }

  return (
    <>
      <div className="bg-slate-50 px-2">
        <div className="flex flex-wrap py-2 px-2 space-x-4 pl-4">
          <div className="flex flex-row items-center mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 text-amber-700 dark:text-white"
            >
              <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z" clipRule="evenodd" />
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
              className={filterClass(rp.key, reportType.key)}
            >
              {rp.name}
            </Link>)
          })}
        </div>

        <div className="flex flex-wrap py-2 space-x-4">
          <div className="space-x-2 pl-4">
            {timeFilters.map((per) => {
              return (<Link key={per.name}
                onClick={() => calculatePeriod(per)}
                relative="route"
                className={filterClass(per.name, period.name)}
              >
                {per.name}
              </Link>)
            })}
          </div>
        </div>

        <div className="flex flex-col w-full  rounded-lg border border-spacing-1 px-2 py-2 mb-6 mx-1 shadow-sm">
          <div className="flex flex-row space-x-2 ">
            <div className="flex flex-col w-1/2 rounded-lg border border-spacing-1 px-2 py-2 shadow-lg">
              <div>
                <span className="font font-bold text-gray-500">Revenue</span>
              </div>
              <div>
                <span>{toVND(report.overall.revenue)}</span>
              </div>
            </div>
            <div className="flex flex-col w-1/2 rounded-lg border border-spacing-1 px-2 py-2 shadow-lg">
              <div>
                <span className="font font-bold text-gray-500">Expenditure</span>
              </div>
              <div>
                <span>{toVND(report.overall.expense)}</span>
              </div>
            </div>
          </div>
          <div className="w-full py-1 flex flex-row justify-items-center pt-3">
            <span className="w-1/2 text-right font font-bold text-gray-500 pr-1">Profit:</span>
            <span className="w-1/2 text-left pl-1">{toVND(report.overall.profit)}</span>
          </div>
        </div>

        <div className="flex flex-col w-full space-y-2">
          {report.breakdown.map((item) => {
            return (
              <div key={item.name} className="flex flex-col py-1 border border-spacing-1 shadow-sm rounded-md">
                <div className="text-left px-4 mb-2">
                  <span
                    className="font-sans font-semibold text-gray-500 text-[12px]"
                  >
                    {item.displayName}
                  </span>
                </div>
                <div className="flex flex-row">
                  <span
                    className="px-2 text-right font-sans w-1/3 text-sm font-semibold text-gray-500"
                  >
                    {toVND(item.revenue)}
                  </span>
                  <span
                    className="px-2 text-right font-sans w-1/3 text-sm font-semibold text-gray-500"
                  >
                    {toVND(item.expense)}
                  </span>
                  <span
                    className="px-2 text-right font-sans w-1/3 text-sm font-semibold text-gray-500"
                  >
                    {toVND(item.profit)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div >
    </>
  )
}
