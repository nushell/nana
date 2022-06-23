import {
  humanDuration,
  humanFileSize,
  UInt8ArrayToString,
} from '../support/formatting';

const Image = ({ value, type }: { value: any; type: string }) => (
  <img
    alt="image"
    className="h-auto max-w-full"
    src={`data:${type};base64,${btoa(
      UInt8ArrayToString(new Uint8Array(value))
    )}`}
  />
);

const Binary = ({ value: { val } }: { value: any }): any => {
  if (val[0] == 0x89 && val[1] == 0x50 && val[2] == 0x4e && val[3] == 0x47) {
    return <Image value={val} type="image/png" />;
  } else {
    var header = [];
    var arow = [];
    var rows = [];
    for (let idx = 0; idx < 16; ++idx) {
      header.push(<th>{idx.toString(16)}</th>);
    }
    let arrLen = val.length;
    for (let idx = 0; idx < arrLen; ++idx) {
      if (idx % 16 == 0) {
        if (idx > 0) {
          rows.push(<tr>{arow}</tr>);
          arow = [];
        }
        arow.push(<th>{((idx / 16) * 16).toString(16)}</th>);
      }
      arow.push(<td>{val[idx].toString(16)}</td>);
    }
    return (
      <table className="styled-table">
        <tr>
          <th>
            <strong>hex</strong>
          </th>
          {header}
        </tr>
        {rows}
      </table>
    );
  }
};

const Record = ({ value: { cols, vals } }: { value: any }) => (
  <table className="styled-table">
    <tbody>
      {vals.map((val: any, i: number) => (
        <tr key={i}>
          <th>{cols[i]}</th>
          <td>
            <Output value={val} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const List = ({ value: { vals } }: { value: any }): any => {
  if (vals.length > 0) {
    const isRecordList = vals.every((v: any) => v.Record);
    const cols = isRecordList ? vals[0].Record.cols : [];
    return (
      <table className="styled-table">
        <tbody>
          <tr>
            {cols.map((col: string, i: number) => (
              <th key={i}>{col}</th>
            ))}
          </tr>
          {vals.map((value: any, i: number) => (
            <tr key={i}>
              {isRecordList ? (
                value.Record.vals.map((v: any, j: number) => (
                  <td key={j}>
                    <Output value={v}></Output>
                  </td>
                ))
              ) : (
                <td>
                  <Output value={value}></Output>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return [];
};

export const Output = ({ value }: { value: any }): any => {
  if (!value || value.Nothing) {
    return null;
  } else if (value.Int) {
    return value.Int.val.toString();
  } else if (value.Float) {
    return value.Float.val.toString();
  } else if (value.Bool) {
    return value.Bool.val.toString();
  } else if (value.String) {
    return value.String.val ? <pre>{value.String.val}</pre> : <>&nbsp;</>;
  } else if (value.Filesize) {
    return humanFileSize(value.Filesize.val);
  } else if (value.Duration) {
    return humanDuration(value.Duration.val);
  } else if (value.Date) {
    return new Date(Date.parse(value.Date.val)).toISOString();
  } else if (value.Binary) {
    return <Binary value={value.Binary} />;
  } else if (value.Record) {
    return <Record value={value.Record} />;
  } else if (value.List) {
    return <List value={value.List}></List>;
  }

  // todo: use rehype-sanitize
  return <pre dangerouslySetInnerHTML={{ __html: value }} />;
};
