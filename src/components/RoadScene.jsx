// A highway-style sign badge. The road itself now runs behind every page via
// RoadBackdrop — this just marks a page's "you are here" moment on top of it.
export default function RoadScene({ signText, subText }) {
  return (
    <div className="hwy-sign">
      <div className="hwy-sign-top">{signText}</div>
      {subText && <div className="hwy-sign-sub">{subText}</div>}
    </div>
  )
}
