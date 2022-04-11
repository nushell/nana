use nu_engine::eval_block;
use nu_parser::parse;
use nu_protocol::{
    engine::{EngineState, Stack, StateWorkingSet},
    PipelineData, ShellError,
};

pub fn eval_nushell(
    engine_state: &mut EngineState,
    stack: &mut Stack,
    source: &[u8],
    fname: &str,
    input: PipelineData,
) -> Result<PipelineData, ShellError> {
    // println!("{:#?}", source);
    // if source == b"foo" {
    //     use std::process::Command;
    //     use nu_protocol::{Span, Value};
    //     let command = Command::new("alacritty").arg("-e").arg("vim").spawn();
    //     match command {
    //         Ok(child) => {
    //             return Ok(PipelineData::Value(
    //                 Value::String {
    //                     val: "running external".into(),
    //                     span: Span { start: 0, end: 0 },
    //                 },
    //                 None,
    //             ))
    //         }
    //         Err(e) => {
    //             return Ok(PipelineData::Value(
    //                 Value::String {
    //                     val: e.to_string(),
    //                     span: Span { start: 0, end: 0 },
    //                 },
    //                 None,
    //             ))
    //         }
    //     }
    // }
    let (block, delta) = {
        let mut working_set = StateWorkingSet::new(engine_state);
        let (output, _) = parse(&mut working_set, Some(fname), source, false, &[]);

        (output, working_set.render())
    };

    let cwd = nu_engine::env::current_dir_str(engine_state, stack)?;

    if let Err(err) = engine_state.merge_delta(delta, Some(stack), &cwd) {
        return Err(err);
    }

    eval_block(engine_state, stack, &block, input, true, true)
}
