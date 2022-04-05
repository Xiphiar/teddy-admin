import React, {useState} from "react";
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'

export default function TraitSelect({value, set, label, options}) {
    const [selected, setSelected] = useState(false)
    const [customValue, setCustomValue] = useState('')

    //if (selected === "Other" && customValue) set(customValue)
    return (
        <Row className="mb-3">
            <Form.Group as={Row} controlId="BaseDesignSelect">
                <Col md="4">
                    <Form.Label>{label}</Form.Label>
                    <Form.Control
                        required
                        as="select"
                        value={selected}
                        onChange={e => {
                            if (e.target.value === "Other") {
                                set(customValue)
                            } else {
                                set(e.target.value)
                            }
                            setSelected(e.target.value);
                    }}
                    >
                        <option value={false} key={`${label}-none`}>None</option>
                        {options.map((item) => {
                            return (<option key={`${label}-${item}`}>{item}</option>)
                        })}
                        <option key={`${label}-other`}>Other</option>
                    </Form.Control>
                </Col>
                
                { selected === "Other" ? 
                    <>
                        <Col md="4">
                        <Form.Label>{`Other ${label}`}</Form.Label>
                        <Form.Control
                            required
                            type="text"
                            value={customValue}
                            onChange={e => {
                                setCustomValue(e.target.value)
                                set(e.target.value)
                            }}
                        />
                        <Form.Control.Feedback>Looks good!</Form.Control.Feedback>
                        </Col>
                    </>
                :
                    null
                }

            </Form.Group>
        </Row>
    );
}
  