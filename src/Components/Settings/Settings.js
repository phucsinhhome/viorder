import { formatDatePartition } from "../../Service/Utils";
import { syncStatusOfMonth } from "../../Service/StatusSyncingService";
import { useState } from "react";
import { Label, Spinner, TextInput } from "flowbite-react";
import { IoIosSync } from "react-icons/io";

const syncedResOptions = [
  {
    nextDays: 0,
    displayName: 'Today'
  }, {
    nextDays: 1,
    displayName: 'Tomorrow'
  }, {
    nextDays: 5,
    displayName: 'Next 5 days'
  }
]

export function Settings({ syncing, changeSyncing }) {

  const [datePartition, setDatePartition] = useState(formatDatePartition(new Date()))
  const [syncedResNextDays, setSyncedResNextDays] = useState(0)

  const syncStatus = () => {
    changeSyncing(true)
    console.info("Sync status")
    syncStatusOfMonth(datePartition)
      .then(rsp => {
        if (rsp.ok) {
          console.info("Sync status of %s successfully", datePartition)
        }
        console.log(rsp)
      }).catch(e => {
        console.error(e)
      }).finally(() => {
        changeSyncing(false)
      })
  }

  const changePartition = (e) => {
    let iMsg = e.target.value
    setDatePartition(iMsg)
  }

  return (
    <>
      <div className="bg-slate-50 px-2">
        <div className="flex flex-col w-full py-2 px-2">
          <div className="flex flex-row items-center mb-2">
            <Label
              className="w-32"
            >
              {"Sync data"}
            </Label>
            <TextInput
              id="itemMsg"
              placeholder="2024/09 or 2024/09/01"
              required={true}
              value={datePartition}
              onChange={changePartition}
              rightIcon={() => syncing ?
                <Spinner aria-label="Default status example"
                  className="w-14 h-10"
                />
                : <IoIosSync
                  onClick={() => syncStatus()}
                  className="pointer-events-auto cursor-pointer w-14 h-10"
                />
              }
            />
          </div>
          <div className="flex flex-row items-center mb-2">
            <Label
              className="w-32"
            >
              {"Sync reservation"}
            </Label>
            <TextInput
              id="itemMsg"
              placeholder="2024/09 or 2024/09/01"
              required={true}
              value={datePartition}
              onChange={changePartition}
              type="number"

              rightIcon={() => syncing ?
                <Spinner aria-label="Default status example"
                  className="w-14 h-10"
                />
                : <IoIosSync
                  onClick={() => syncStatus()}
                  className="pointer-events-auto cursor-pointer w-14 h-10"
                />
              }
            />
            <Label
              className="w-32"
            >
              {"reservation"}
            </Label>
          </div>
        </div>

      </div >
    </>
  )
}
